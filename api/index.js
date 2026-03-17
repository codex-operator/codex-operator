const FALLBACK_COLORS = ['#3f88e6', '#00ffff', '#ff4500', '#ff00ff', '#00ff00', '#ffb86c', '#f1fa8c'];

function escapeXml(str) {
    return str.replace(/[<>&"']/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'}[c]));
}

function isValidHex(color) {
    return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color);
}

function randomColor() {
    return FALLBACK_COLORS[Math.floor(Math.random() * FALLBACK_COLORS.length)];
}

export default async function handler(req, res) {
    const username = req.query.user || 'OstinUA';
    const repo     = req.query.repo || 'Image-storage';

    try {
        const headers = { 'User-Agent': 'bounce-badge' };
        if (process.env.GITHUB_TOKEN) {
            headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
        }

        const apiRes = await fetch(
            `https://api.github.com/repos/${username}/${repo}/issues?state=all&per_page=50`,
            { headers }
        );

        if (!apiRes.ok) throw new Error(`GitHub API error: ${apiRes.status}`);

        const issues = await apiRes.json();
        const authors = [];
        const seen    = new Set();

        // Matches:
        //   <HeroeName|Username>
        //   <HeroeName|Username|#RRGGBB>  or  <HeroeName|Username|#RGB>
        const RE = /^<\s*heroename\s*\|\s*([a-zA-Z\u0400-\u04FF0-9_ -]{1,15})\s*(?:\|\s*(#[0-9a-fA-F]{3,6})\s*)?\s*>$/i;

        for (const issue of issues) {
            const raw = (issue.title || '').trim();
            const m   = raw.match(RE);
            if (!m) continue;

            const name  = m[1].trim();
            const color = (m[2] && isValidHex(m[2])) ? m[2] : randomColor();

            if (!seen.has(name)) {
                seen.add(name);
                authors.push({ name, color });
            }
            if (authors.length >= 7) break;
        }

        while (authors.length < 7) {
            authors.push({ name: 'Write-Issues', color: '#555566' });
        }

        const width  = 850;
        const height = 200;

        let styles = '';
        let elems  = '';

        authors.forEach(({ name, color }, i) => {
            const durX  = (Math.random() * 4 + 4).toFixed(1);
            const durY  = (Math.random() * 3 + 3).toFixed(1);
            const delX  = -(Math.random() * durX).toFixed(1);
            const delY  = -(Math.random() * durY).toFixed(1);
            const dirX  = Math.random() > 0.5 ? 'alternate' : 'alternate-reverse';
            const dirY  = Math.random() > 0.5 ? 'alternate' : 'alternate-reverse';

            const safeColor = isValidHex(color) ? color : '#888888';
            const charWidth = 10.8;
            const textWidth = name.length * charWidth;
            const maxX      = Math.max(10, width  - textWidth - 20);
            const maxY      = Math.max(40, height - 20);
            const safeName  = escapeXml(name);

            styles += `
.gX${i}{animation:mX${i} ${durX}s linear ${delX}s infinite ${dirX};}
.tY${i}{fill:${safeColor};font-family:monospace;font-size:18px;font-weight:bold;
        text-shadow:2px 2px 4px rgba(0,0,0,.9),-1px -1px 3px rgba(0,0,0,.7);
        animation:mY${i} ${durY}s linear ${delY}s infinite ${dirY};}
@keyframes mX${i}{0%{transform:translateX(10px)}100%{transform:translateX(${maxX}px)}}
@keyframes mY${i}{0%{transform:translateY(40px)}100%{transform:translateY(${maxY}px)}}
`;
            elems += `<g class="gX${i}"><text class="tY${i}">${safeName}</text></g>\n`;
        });

        const svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
<rect width="100%" height="100%" fill="transparent" stroke="#30363d" stroke-width="2"/>
<text x="15" y="25" fill="#8b949e" font-family="monospace" font-size="14" style="text-shadow:1px 1px 2px #000;">Heroes from Issues:</text>
<style>${styles}</style>
${elems}</svg>`;

        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', 'no-cache, s-maxage=60, stale-while-revalidate');
        res.status(200).send(svg.trim());

    } catch (err) {
        const errorSvg = `<svg width="850" height="200" xmlns="http://www.w3.org/2000/svg">
<rect width="100%" height="100%" fill="transparent" stroke="#ff0000" stroke-width="2"/>
<text x="20" y="40" fill="#ff0000" font-family="monospace" font-size="16">${escapeXml(err.message)}</text>
</svg>`;
        res.setHeader('Content-Type', 'image/svg+xml');
        res.status(500).send(errorSvg.trim());
    }
}
