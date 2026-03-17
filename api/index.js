export default async function handler(req, res) {
    const username = req.query.user || 'OstinUA';
    const repo = req.query.repo || 'Image-storage';

    try {
        // Получаем список Issues через публичное API GitHub
        const apiRes = await fetch(`https://api.github.com/repos/${username}/${repo}/issues?state=all&per_page=30`);
        
        if (!apiRes.ok) {
            throw new Error('Не удалось получить данные от GitHub API');
        }
        
        const issues = await apiRes.json();

        // Собираем уникальные ники авторов
        let authors = [...new Set(issues.map(i => i.user.login))].filter(Boolean).slice(0, 5);
        
        // Если Issues меньше 5, заполняем пустые места заглушками
        while (authors.length < 5) {
            authors.push(`Waiting...`);
        }

        // Параметры холста SVG
        const width = 600;
        const height = 150;

        let styles = '';
        let textElements = '';

        // Набор неоновых цветов
        const colors = ['#3f88e6', '#00ffff', '#ff4500', '#ff00ff', '#00ff00'];

        authors.forEach((author, i) => {
            // Разная скорость для создания хаотичных траекторий
            const durX = (Math.random() * 3 + 3).toFixed(1); // От 3 до 6 секунд
            const durY = (Math.random() * 2 + 2).toFixed(1); // От 2 до 4 секунд
            const color = colors[i % colors.length];
            
            // Расчет границ отскока на основе длины ника
            const charWidth = 9.6; 
            const textWidth = author.length * charWidth;
            const maxX = width - textWidth - 10;
            const maxY = height - 10;

            // Генерация CSS-правил для каждого ника
            styles += `
                .user${i} {
                    fill: ${color};
                    font-family: monospace;
                    font-size: 16px;
                    font-weight: bold;
                    animation: moveX${i} ${durX}s linear infinite alternate, moveY${i} ${durY}s linear infinite alternate;
                }
                @keyframes moveX${i} { 
                    0% { transform: translateX(10px); } 
                    100% { transform: translateX(${maxX}px); } 
                }
                @keyframes moveY${i} { 
                    0% { transform: translateY(20px); } 
                    100% { transform: translateY(${maxY}px); } 
                }
            `;

            textElements += `<text class="user${i}">${author}</text>\n`;
        });

        // Сборка финального SVG
        const svg = `
            <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" fill="#0d1117" rx="8" stroke="#30363d" stroke-width="2"/>
                <text x="10" y="20" fill="#8b949e" font-family="monospace" font-size="12">Recent Issue Authors:</text>
                
                <style>${styles}</style>
                ${textElements}
            </svg>
        `;

        res.setHeader('Content-Type', 'image/svg+xml');
        // Кэшируем на 60 секунд. При каждом запросе Vercel отдаст кэш, но в фоне пойдет за новыми данными
        res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
        res.status(200).send(svg.trim());

    } catch (error) {
        // SVG с ошибкой, если репозиторий не найден или API GitHub недоступно
        const errorSvg = `
            <svg width="600" height="150" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" fill="#0d1117" rx="8" stroke="#ff0000" stroke-width="2"/>
                <text x="20" y="40" fill="#ff0000" font-family="monospace" font-size="16">Error loading GitHub data.</text>
                <text x="20" y="70" fill="#8b949e" font-family="monospace" font-size="12">Check repository name or API limits.</text>
            </svg>
        `;
        res.setHeader('Content-Type', 'image/svg+xml');
        res.status(500).send(errorSvg.trim());
    }
}
