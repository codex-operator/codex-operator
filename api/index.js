export default async function handler(req, res) {
    const username = req.query.user || 'OstinUA';
    const repo = req.query.repo || 'Image-storage';

    try {
        const apiRes = await fetch(`https://api.github.com/repos/${username}/${repo}/issues?state=all&per_page=50`);
        
        if (!apiRes.ok) {
            throw new Error('Не удалось получить данные от GitHub API');
        }
        
        const issues = await apiRes.json();
        let authors = [];

        for (const issue of issues) {
            const content = `${issue.title} ${issue.body || ''}`;
            const match = content.match(/<([^>]+)>/);
            
            if (match && match[1]) {
                const cleanName = match[1].replace(/[^a-zA-Zа-яА-Я0-9 _-]/g, '').trim().substring(0, 15);
                if (cleanName && !authors.includes(cleanName)) {
                    authors.push(cleanName);
                }
            }
            if (authors.length >= 5) break;
        }
        
        while (authors.length < 5) {
            authors.push(`Waiting...`);
        }

        // Увеличенные параметры холста
        const width = 800;
        const height = 250;

        let styles = '';
        let textElements = '';

        const colors = ['#3f88e6', '#00ffff', '#ff4500', '#ff00ff', '#00ff00'];

        authors.forEach((author, i) => {
            // Увеличил время анимации, так как холст стал больше
            const durX = (Math.random() * 4 + 4).toFixed(1); 
            const durY = (Math.random() * 3 + 3).toFixed(1); 
            const color = colors[i % colors.length];
            
            // Расчет границ
            const charWidth = 10.8; // Немного увеличил ширину символа для шрифта 18px
            const textWidth = author.length * charWidth;
            const maxX = width - textWidth - 20;
            const maxY = height - 20;

            // Теперь moveX применяется к группе, а moveY к тексту
            styles += `
                .groupX${i} {
                    animation: moveX${i} ${durX}s linear infinite alternate;
                }
                .userY${i} {
                    fill: ${color};
                    font-family: monospace;
                    font-size: 18px;
                    font-weight: bold;
                    animation: moveY${i} ${durY}s linear infinite alternate;
                }
                @keyframes moveX${i} { 
                    0% { transform: translateX(10px); } 
                    100% { transform: translateX(${maxX}px); } 
                }
                @keyframes moveY${i} { 
                    0% { transform: translateY(40px); } /* Смещение вниз, чтобы текст не обрезался сверху */
                    100% { transform: translateY(${maxY}px); } 
                }
            `;

            // Оборачиваем текст в группу <g>
            textElements += `<g class="groupX${i}"><text class="userY${i}">${author}</text></g>\n`;
        });

        const svg = `
            <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" fill="#0d1117" rx="8" stroke="#30363d" stroke-width="2"/>
                <text x="15" y="25" fill="#8b949e" font-family="monospace" font-size="14">Heroes from Issues:</text>
                
                <style>${styles}</style>
                ${textElements}
            </svg>
        `;

        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
        res.status(200).send(svg.trim());

    } catch (error) {
        const errorSvg = `
            <svg width="800" height="250" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" fill="#0d1117" rx="8" stroke="#ff0000" stroke-width="2"/>
                <text x="20" y="40" fill="#ff0000" font-family="monospace" font-size="16">Error loading GitHub data.</text>
            </svg>
        `;
        res.setHeader('Content-Type', 'image/svg+xml');
        res.status(500).send(errorSvg.trim());
    }
}
