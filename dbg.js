const https = require('https');
const fs = require('fs');

const req = https.request({ hostname: 'yields.llama.fi', path: '/pools', method: 'GET' }, res => {
    let body = [];
    res.on('data', d => body.push(d));
    res.on('end', () => {
        try {
            const data = JSON.parse(Buffer.concat(body).toString());
            const btcs = data.data.filter(p => (p.symbol || '').includes('BTC') && typeof p.apyBaseBorrow === 'number' && p.apyBaseBorrow > 0);
            btcs.sort((a, b) => (b.tvlUsd || 0) - (a.tvlUsd || 0));
            fs.writeFileSync('result.txt', JSON.stringify(btcs.slice(0, 5), null, 2));
        } catch (e) {
            fs.writeFileSync('result.txt', e.message);
        }
    });
});
req.end();
