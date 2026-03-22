/**
 * Represents the DOM extraction logic for Farside's table.
 * This function will be executed inside Puppeteer's run context (`page.evaluate()`).
 * It has no external dependencies and must be a pure DOM-parsing function.
 */
export const extractFarsideData = () => {
    const dataList: any[] = [];
    const trs = Array.from(document.querySelectorAll('tr'));
    
    for (const tr of trs) {
        const cells = Array.from(tr.querySelectorAll('td')).map((td: any) => td?.textContent?.trim() || '');

        if (cells.length > 0) {
            const dateText = cells[0];
            let totalText = cells[cells.length - 1];

            if (dateText && totalText) {
                if (totalText === '-' || totalText === '' || totalText === 'Total') continue;

                // Handle Farside's negative values which are enclosed in parentheses: (15.2) -> -15.2
                if (totalText.includes('(') && totalText.includes(')')) {
                    totalText = '-' + totalText.replace(/[()]/g, '');
                }
                
                // Handle comma separators just in case (e.g., 1,234.5)
                totalText = totalText.replace(/,/g, '');

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
};
