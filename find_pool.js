const https = require('https');

https.get('https://yields.llama.fi/pools', (res) => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => {
        try {
            const data = JSON.parse(body);
            const pools = data.data.filter(p =>
                (p.symbol.includes('WBTC') || p.symbol.includes('BTCB')) &&
                p.apyBaseBorrow > 0 &&
                p.tvlUsd > 10000000
            ).sort((a, b) => b.tvlUsd - a.tvlUsd).slice(0, 5);

            pools.forEach(p => {
                console.log(`${p.project} (${p.chain}) - ${p.symbol}`);
                console.log(`Borrow APY: ${p.apyBaseBorrow} | Supply APY: ${p.apyBase} | TVL: ${p.tvlUsd}`);
                console.log(`ID: ${p.pool}`);
                console.log('---');
            });
        } catch (e) {
            console.error('Error parsing JSON:', e);
        }
    });
}).on('error', e => console.error(e));
