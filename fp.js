const https = require('https');
const fs = require('fs');

const options = {
    hostname: 'yields.llama.fi',
    port: 443,
    path: '/pools',
    method: 'GET',
    headers: { 'User-Agent': 'Mozilla/5.0' }
};

console.log("Downloading DefiLlama pools...");
const req = https.request(options, res => {
    let body = [];
    res.on('data', d => body.push(d));
    res.on('end', () => {
        try {
            const data = JSON.parse(Buffer.concat(body).toString());
            const pools = data.data.filter(p => p.symbol.includes('BTC') && p.apyBaseBorrow > 0 && p.tvlUsd > 10000000).sort((a, b) => b.totalBorrowUsd - a.totalBorrowUsd);
            const out = pools.slice(0, 10).map(p => `${p.project} ${p.chain} ${p.symbol} Borrow: ${p.apyBaseBorrow}% Supply: ${p.apyBase}% TVL: ${p.tvlUsd} ID: ${p.pool}`).join('\n');
            fs.writeFileSync('result.txt', out);
            console.log('Saved to result.txt');
        } catch (e) {
            fs.writeFileSync('result.txt', 'Error: ' + e.message);
            console.error('Parse Error:', e.message);
        }
    });
});
req.on('error', e => {
    fs.writeFileSync('result.txt', 'HTTP Error: ' + e.message);
    console.error(e);
});
req.end();
