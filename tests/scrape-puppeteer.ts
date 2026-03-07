import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import * as fs from 'fs';

puppeteer.use(StealthPlugin());

async function scrapeFarside() {
    console.log("Launching browser...");
    let executablePath = undefined;
    if (fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')) {
        executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    } else if (fs.existsSync('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe')) {
        executablePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
    }

    const browser = await puppeteer.launch({
        headless: true,
        executablePath: executablePath
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
        fs.writeFileSync('farside-data.json', JSON.stringify(data, null, 2));
        console.log("Data saved to farside-data.json");
    } else {
        const html = await page.content();
        fs.writeFileSync('farside-error.html', html);
        console.log("Failed to find data. Wrote page HTML to farside-error.html");
        await page.screenshot({ path: 'farside-error.png' });
        console.log("Screenshot saved to farside-error.png");
    }

    await browser.close();
}

scrapeFarside().catch(console.error);
