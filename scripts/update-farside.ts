import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import * as fs from 'fs';
import * as path from 'path';

puppeteer.use(StealthPlugin());

async function scrapeFarside() {
    console.log("Launching browser...");
    let executablePath = undefined;

    // Use local Chrome/Edge if running locally on Windows
    if (!process.env.CI) {
        if (fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')) {
            executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
        } else if (fs.existsSync('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe')) {
            executablePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
        }
    }

    const browser = await puppeteer.launch({
        headless: true,
        executablePath: executablePath,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    await page.setViewport({ width: 1280, height: 800 });
    console.log("Navigating to Farside...");

    await page.goto('https://farside.co.uk/bitcoin-etf-flow-all-data/', {
        waitUntil: 'networkidle2',
        timeout: 60000
    });

    console.log("Waiting for table or Cloudflare challenge...");
    await new Promise(r => setTimeout(r, 10000));

    console.log("Extracting table data...");
    const data = await page.evaluate(() => {
        const dataList: any[] = [];
        const trs = Array.from(document.querySelectorAll('tr'));

        for (const tr of trs) {
            const cells = Array.from(tr.querySelectorAll('td')).map((td: any) => td.textContent.trim());

            if (cells.length > 0) {
                const dateText = cells[0];
                let totalText = cells[cells.length - 1];

                if (dateText && totalText) {
                    if (totalText.includes('(') && totalText.includes(')')) {
                        totalText = '-' + totalText.replace(/[()]/g, '');
                    }
                    totalText = totalText.replace(/,/g, '');

                    if (dateText.match(/\d+\s+\w+\s+\d+/) && !isNaN(parseFloat(totalText))) {
                        dataList.push({
                            date: dateText,
                            total: parseFloat(totalText) * 1_000_000,
                        });
                    }
                }
            }
        }
        return dataList;
    });

    console.log(`Extracted ${data.length} rows of data.`);

    if (data.length > 0) {
        // Save to lib/data/farside-data.json
        const outputDir = path.join(process.cwd(), 'lib', 'data');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        const outputPath = path.join(outputDir, 'farside-data.json');

        fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
        console.log(`Data saved successfully to ${outputPath}`);
    } else {
        console.error("Failed to find data. Cloudflare might have blocked the request.");
        process.exit(1);
    }

    await browser.close();
}

scrapeFarside().catch((err) => {
    console.error("Scraping failed:", err);
    process.exit(1);
});
