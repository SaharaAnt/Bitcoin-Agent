const https = require('https');
const fs = require('fs');
const req = https.request({ hostname: 'yields.llama.fi', path: '/pools', method: 'GET', headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
    let body = [];
    res.on('data', d => body.push(d));
    res.on('end', () => {
        try {
            const data = JSON.parse(Buffer.concat(body).toString());
            const btcs = data.data.filter(p => p.symbol && p.symbol.includes('BTC') && typeof p.apyBaseBorrow === 'number' && p.apyBaseBorrow > 0 && p.tvlUsd > 1000000);
            btcs.sort((a, b) => b.totalBorrowUsd - a.totalBorrowUsd);
            fs.writeFileSync('ok.txt', btcs.slice(0, 5).map(p => `${p.project} ${p.chain} ${p.symbol} - BorrowAPY: ${p.apyBaseBorrow.toFixed(2)}% TVL: $${(p.tvlUsd / 1e6).toFixed(1)}M Borrowed: $${(p.totalBorrowUsd / 1e6).toFixed(1)}M ID: ${p.pool}`).join('\n'));
            console.log("Done");
        } catch (e) {
            fs.writeFileSync('ok.txt', e.message);
        }
    });
});
req.on('error', e => fs.writeFileSync('ok.txt', 'Err: ' + e.message));
req.end();
