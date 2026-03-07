const https = require('https');
const fs = require('fs');

console.log("Starting stream extraction...");
https.get('https://yields.llama.fi/pools', (res) => {
    const file = fs.createWriteStream('pools_extract.txt');
    let remain = '';
    res.on('data', d => {
        remain += d;
        const regex = /"pool":"([^"]+)","project":"([^"]+)","symbol":"([^"]+)".*?"apyBaseBorrow":([0-9.]+)/g;
        let match;
        const newRemainIndex = remain.length - 1500;

        while ((match = regex.exec(remain)) !== null) {
            if ((match[3].includes('BTC') || match[3].includes('WBTC')) && parseFloat(match[4]) > 0) {
                file.write(`${match[2]} (${match[3]}): Borrow ${match[4]}% - UUID: ${match[1]}\n`);
            }
        }

        if (remain.length > 2000) {
            remain = remain.slice(newRemainIndex > 0 ? newRemainIndex : 0);
        }
    });
    res.on('end', () => {
        file.end();
        console.log("Extraction complete.");
    });
}).on('error', e => console.error("Error:", e.message));
