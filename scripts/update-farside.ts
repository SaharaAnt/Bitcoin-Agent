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
        await page.setViewport({ width: 1280, height: 1000 });
        
        // Add a random user agent to look more human
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');

        console.log("[update-farside] Navigating to Farside...");
        const response = await page.goto('https://farside.co.uk/bitcoin-etf-flow-all-data/', {
            waitUntil: 'networkidle2',
            timeout: 90000
        });

        console.log(`[update-farside] Response status: ${response?.status()}`);

        // Wait for table to be visible
        try {
            await page.waitForSelector('table', { timeout: 30000 });
            console.log("[update-farside] Table found.");
        } catch (e) {
            console.error("[update-farside] Table NOT found within timeout.");
            await page.screenshot({ path: 'error-no-table.png' });
            throw new Error("Table not found");
        }

        // Wait a bit for potential JS to render the table if needed
        await new Promise(r => setTimeout(r, 5000));

        // Scroll to bottom to ensure any dynamic content is loaded
        console.log("[update-farside] Scrolling and ensuring latest data...");
        await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight);
        });
        await new Promise(r => setTimeout(r, 2000));

        console.log("[update-farside] Extracting table data...");
        const result = await page.evaluate(() => {
            const dataList: any[] = [];
            const trs = Array.from(document.querySelectorAll('tr'));
            
            for (const tr of trs) {
                const cells = Array.from(tr.querySelectorAll('td')).map((td: any) => td.textContent.trim());

                if (cells.length > 0) {
                    const dateText = cells[0];
                    let totalText = cells[cells.length - 1];

                    if (dateText && totalText) {
                        // Handle dashes or placeholder text
                        if (totalText === '-' || totalText === '' || totalText === 'Total') continue;

                        // Handle negative values in parentheses
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
            return { length: trs.length, data: dataList };
        });

        console.log(`[update-farside] Scanned ${result.length} rows, found ${result.data.length} valid data points.`);

        if (result.data.length > 0) {
            const data = result.data;
            // Check for the latest entry
            const latest = data[data.length - 1];
            console.log(`[update-farside] Latest data point: ${latest.date} -> ${latest.total / 1_000_000}M`);

            const outputDir = path.join(process.cwd(), 'lib', 'data');
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }
            const outputPath = path.join(outputDir, 'farside-data.json');

            // Read existing data to check if we actually have anything new
            let currentDataSize = 0;
            if (fs.existsSync(outputPath)) {
                const existing = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
                currentDataSize = existing.length;
                console.log(`[update-farside] Existing data has ${currentDataSize} entries.`);
            }

            if (data.length >= currentDataSize) {
                fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
                console.log(`[update-farside] Data saved successfully to ${outputPath} (${data.length} entries)`);
            } else {
                console.warn(`[update-farside] Scraped data (${data.length}) is smaller than existing data (${currentDataSize}). Skipping write to prevent data loss.`);
            }
        } else {
            console.error("[update-farside] Failed to find data. Possibly blocked by Cloudflare or site structure changed.");
            await page.screenshot({ path: 'error-no-data.png' });
            const html = await page.content();
            fs.writeFileSync('temp-debug-farside.html', html);
            console.log("[update-farside] Saved screenshot and page HTML for debugging.");
            throw new Error("No data found");
        }
    } catch (error) {
        console.error("[update-farside] An error occurred during scraping:", error);
        throw error;
    } finally {
        await browser.close();
        console.log("[update-farside] Browser closed.");
    }
}

scrapeFarside().catch((err) => {
    console.error("[update-farside] Fatal error:", err);
    process.exit(1);
});
