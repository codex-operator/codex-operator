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
            if (authors.length >= 7) break;
        }
        
        while (authors.length < 7) {
            authors.push(`Waiting...`);
        }

        const width = 800;
        const height = 250;

        let styles = '';
        let textElements = '';

        const colors = ['#3f88e6', '#00ffff', '#ff4500', '#ff00ff', '#00ff00', '#ffb86c', '#f1fa8c'];

        authors.forEach((author, i) => {
            const durX = (Math.random() * 4 + 4).toFixed(1); 
            const durY = (Math.random() * 3 + 3).toFixed(1); 
            
            const delayX = -(Math.random() * durX).toFixed(1);
            const delayY = -(Math.random() * durY).toFixed(1);

            // Случайный выбор изначального вектора движения
            const dirX = Math.random() > 0.5 ? 'alternate' : 'alternate-reverse';
            const dirY = Math.random() > 0.5 ? 'alternate' : 'alternate-reverse';

            const color = colors[i % colors.length];
            
            const charWidth = 10.8; 
            const textWidth = author.length * charWidth;
            const maxX = width - textWidth - 20;
            const maxY = height - 20;

            styles += `
                .groupX${i} {
                    animation: moveX${i} ${durX}s linear ${delayX}s infinite ${dirX};
                }
                .userY${i} {
                    fill: ${color};
                    font-family: monospace;
                    font-size: 18px;
                    font-weight: bold;
                    /* Двойная тень для создания плотного темного контура */
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.9), -1px -1px 3px rgba(0,0,0,0.7);
                    animation: moveY${i} ${durY}s linear ${delayY}s infinite ${dirY};
                }
                @keyframes moveX${i} { 
                    0% { transform: translateX(10px); } 
                    100% { transform: translateX(${maxX}px); } 
                }
                @keyframes moveY${i} { 
                    0% { transform: translateY(40px); } 
                    100% { transform: translateY(${maxY}px); } 
                }
            `;

            textElements += `<g class="groupX${i}"><text class="userY${i}">${author}</text></g>\n`;
        });

        // fill="transparent" делает фон прозрачным, а stroke убран, чтобы не было рамки
        const svg = `
            <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" fill="transparent" />
                <text x="15" y="25" fill="#8b949e" font-family="monospace" font-size="14" style="text-shadow: 1px 1px 2px #000;">Heroes from Issues:</text>
                
                <style>${styles}</style>
                ${textElements}
            </svg>
        `;

        res.setHeader('Content-Type', 'image/svg+xml');
        // Запрещаем жесткое кэширование браузером, но оставляем кэш Vercel на 60 секунд
        res.setHeader('Cache-Control', 'no-cache, s-maxage=60, stale-while-revalidate');
        res.status(200).send(svg.trim());

    } catch (error) {
        const errorSvg = `
            <svg width="800" height="250" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" fill="transparent" />
                <text x="20" y="40" fill="#ff0000" font-family="monospace" font-size="16">Error loading GitHub data.</text>
            </svg>
        `;
        res.setHeader('Content-Type', 'image/svg+xml');
        res.status(500).send(errorSvg.trim());
    }
}
