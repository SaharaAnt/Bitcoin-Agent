const https = require('https');
const fs = require('fs');
https.get('https://yields.llama.fi/pools', res => {
    let body = [];
    res.on('data', d => body.push(d));
    res.on('end', () => {
        const data = JSON.parse(Buffer.concat(body).toString());
        const btcs = data.data.filter(p => p.symbol && p.symbol.includes('BTC') && ['aave-v3', 'venus', 'compound-v3', 'spark'].includes(p.project));
        btcs.sort((a, b) => b.tvlUsd - a.tvlUsd);
        fs.writeFileSync('pools2.txt', btcs.slice(0, 20).map(p => `${p.project} (${p.chain}) - ${p.symbol}: ID=${p.pool}`).join('\n'));
    });
});
