import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import puppeteer, { Browser, Page } from 'puppeteer';
import * as fs from 'fs';
import { extractFarsideData } from '../lib/api/farside-parser';

describe('ETF Farside Data Scraper', () => {
    let browser: Browser;
    let page: Page;

    beforeAll(async () => {
        let executablePath = undefined;
        if (fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')) {
            executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
        } else if (fs.existsSync('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe')) {
            executablePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
        }
        
        browser = await puppeteer.launch({ 
            headless: true, 
            executablePath: executablePath 
        });
        page = await browser.newPage();
    });

    afterAll(async () => {
        if (browser) await browser.close();
    });

    it('should correctly extract dates and handle positive, negative (parentheses), and empty values', async () => {
        const mockHtml = `
            <html>
                <body>
                    <table>
                        <tr>
                            <td>Date</td>
                            <td>IBIT</td>
                            <td>FBTC</td>
                            <td>Total</td>
                        </tr>
                        <tr>
                            <td>12 Mar 2024</td>
                            <td>10.5</td>
                            <td>-</td>
                            <td>(15.2)</td>
                        </tr>
                        <tr>
                            <td>13 Mar 2024</td>
                            <td>-</td>
                            <td>-</td>
                            <td>-</td>
                        </tr>
                        <tr>
                            <td>14 Mar 2024</td>
                            <td>1,234.5</td>
                            <td>20.1</td>
                            <td>1,254.6</td>
                        </tr>
                    </table>
                </body>
            </html>
        `;

        await page.setContent(mockHtml);

        // Run the extraction function inside the page context
        const result = await page.evaluate(extractFarsideData);

        expect(result.data).toHaveLength(2); // row 2 is totally empty so might be skipped or just skipped by parser
        
        expect(result.data[0]).toEqual({
            date: '12 Mar 2024',
            total: -15200000,
        });

        expect(result.data[1]).toEqual({
            date: '14 Mar 2024',
            total: 1254600000, // 1,254.6 M
        });
    });
});
