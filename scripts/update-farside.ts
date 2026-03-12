import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import * as fs from 'fs';
import * as path from 'path';

puppeteer.use(StealthPlugin());

async function scrapeFarside() {
    console.log("[update-farside] Launching browser...");
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
    
    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });
        
        console.log("[update-farside] Navigating to Farside...");
        await page.goto('https://farside.co.uk/bitcoin-etf-flow-all-data/', {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        });

        console.log("[update-farside] Page loaded. Waiting for content...");
        // Wait a bit for potential JS to render the table if needed
        await new Promise(r => setTimeout(r, 5000));

        // Scroll to bottom to ensure any dynamic content is loaded (and to see the latest data which is usually at the bottom)
        console.log("[update-farside] Scrolling to bottom...");
        await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight);
        });
        await new Promise(r => setTimeout(r, 2000));

        console.log("[update-farside] Extracting table data...");
        const data = await page.evaluate(() => {
            const dataList: any[] = [];
            const trs = Array.from(document.querySelectorAll('tr'));
            console.log(`Found ${trs.length} table rows.`);

            for (const tr of trs) {
                const cells = Array.from(tr.querySelectorAll('td')).map((td: any) => td.textContent.trim());

                if (cells.length > 0) {
                    const dateText = cells[0];
                    let totalText = cells[cells.length - 1];

                    if (dateText && totalText) {
                        // Handle dashes or placeholder text
                        if (totalText === '-' || totalText === '') continue;

                        if (totalText.includes('(') && totalText.includes(')')) {
                            totalText = '-' + totalText.replace(/[()]/g, '');
                        }
                        totalText = totalText.replace(/,/g, '');

                        // Date format: 11 Jan 2024
                        const dateRegex = /\d+\s+\w+\s+\d+/;
                        const isDate = dateRegex.test(dateText);
                        const totalNum = parseFloat(totalText);

                        if (isDate && !isNaN(totalNum)) {
                            dataList.push({
                                date: dateText,
                                total: totalNum * 1_000_000,
                            });
                        }
                    }
                }
            }
            return dataList;
        });

        console.log(`[update-farside] Extracted ${data.length} valid rows of data.`);

        if (data.length > 0) {
            // Check for the latest entry
            const latest = data[data.length - 1];
            console.log(`[update-farside] Latest data point: ${latest.date} -> ${latest.total / 1_000_000}M`);

            const outputDir = path.join(process.cwd(), 'lib', 'data');
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }
            const outputPath = path.join(outputDir, 'farside-data.json');

            fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
            console.log(`[update-farside] Data saved successfully to ${outputPath}`);
        } else {
            console.error("[update-farside] Failed to find data. Cloudflare might have blocked the request or table structure changed.");
            const html = await page.content();
            fs.writeFileSync('temp-debug-farside.html', html);
            console.log("[update-farside] Saved page HTML to temp-debug-farside.html for debugging.");
        }
    } catch (error) {
        console.error("[update-farside] An error occurred during scraping:", error);
    } finally {
        await browser.close();
        console.log("[update-farside] Browser closed.");
    }
}

scrapeFarside().catch((err) => {
    console.error("[update-farside] Fatal error:", err);
    process.exit(1);
});
