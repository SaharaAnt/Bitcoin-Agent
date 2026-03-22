import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import * as fs from 'fs';
import * as path from 'path';
import { extractFarsideData } from '../lib/api/farside-parser';

puppeteer.use(StealthPlugin());

async function scrapeWithRetry(retries = 3, delay = 5000) {
    for (let i = 0; i < retries; i++) {
        try {
            console.log(`[update-farside] Attempt ${i + 1}/${retries}...`);
            await scrapeFarside();
            console.log("[update-farside] Success!");
            return;
        } catch (error) {
            console.error(`[update-farside] Attempt ${i + 1} failed:`, error);
            if (i < retries - 1) {
                console.log(`[update-farside] Waiting ${delay}ms before retry...`);
                await new Promise(r => setTimeout(r, delay));
                delay *= 2; // Exponential backoff
            } else {
                throw error;
            }
        }
    }
}

async function scrapeFarside() {
    console.log("[update-farside] Launching browser...");
    let executablePath = undefined;

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
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
            '--disable-infobars',
            '--window-position=0,0',
            '--ignore-certifcate-errors',
            '--ignore-certifcate-errors-spki-list',
            '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            '--proxy-server=http://127.0.0.1:7890'
        ]
    });
    
    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 1000 });
        
        // Remove webdriver property to bypass detection
        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', {
                get: () => false,
            });
        });

        console.log("[update-farside] Navigating to Farside...");
        const response = await page.goto('https://farside.co.uk/bitcoin-etf-flow-all-data/', {
            waitUntil: 'networkidle2',
            timeout: 60000
        });

        const status = response?.status();
        console.log(`[update-farside] Response status: ${status}`);

        if (status === 403) {
            console.error("[update-farside] Blocked by Cloudflare (403).");
            await page.screenshot({ path: 'error-403.png' });
            throw new Error("Blocked by Cloudflare");
        }

        // Wait for table to be visible
        try {
            await page.waitForSelector('table', { timeout: 30000 });
            console.log("[update-farside] Table found.");
        } catch (e) {
            const html = await page.content();
            if (html.includes('Cloudflare') || html.includes('captcha')) {
                console.error("[update-farside] Cloudflare challenge detected.");
                await page.screenshot({ path: 'error-cf-challenge.png' });
            } else {
                console.error("[update-farside] Table NOT found. Structure might have changed.");
                await page.screenshot({ path: 'error-no-table.png' });
            }
            throw new Error("Table not found or blocked");
        }

        await new Promise(r => setTimeout(r, 3000));

        console.log("[update-farside] Extracting table data...");
        const result = await page.evaluate(extractFarsideData);

        console.log(`[update-farside] Scanned ${result.length} rows, found ${result.data.length} valid data points.`);

        if (result.data.length > 0) {
            const data = result.data;
            const latest = data[data.length - 1];
            console.log(`[update-farside] Latest data: ${latest.date} -> ${latest.total / 1_000_000}M`);

            const outputDir = path.join(process.cwd(), 'lib', 'data');
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }
            const outputPath = path.join(outputDir, 'farside-data.json');

            let currentDataSize = 0;
            if (fs.existsSync(outputPath)) {
                const existing = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
                currentDataSize = existing.length;
            }

            if (data.length >= currentDataSize) {
                fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
                console.log(`[update-farside] Saved to ${outputPath} (${data.length} entries)`);
            } else {
                console.warn(`[update-farside] Scraped data (${data.length}) < Existing data (${currentDataSize}). Skipping.`);
            }
        } else {
            throw new Error("No data found");
        }
    } finally {
        await browser.close();
    }
}

scrapeWithRetry().catch((err) => {
    console.error("[update-farside] Fatal error:", err);
    process.exit(1);
});

