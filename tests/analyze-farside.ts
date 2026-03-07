import * as fs from 'fs';

function analyzeData() {
    const raw = fs.readFileSync('farside-data.json', 'utf8');
    const data: { date: string, total: number }[] = JSON.parse(raw);

    if (!data || data.length === 0) {
        console.log("No data to analyze.");
        return;
    }

    let totalInflow = 0;
    let positiveDays = 0;
    let negativeDays = 0;

    // Sort by total for best/worst
    const sorted = [...data].filter(d => !isNaN(d.total)).sort((a, b) => b.total - a.total);

    data.forEach(d => {
        if (!isNaN(d.total)) {
            totalInflow += d.total;
            if (d.total > 0) positiveDays++;
            else if (d.total < 0) negativeDays++;
        }
    });

    const avg = totalInflow / (positiveDays + negativeDays);

    console.log("--- Bitcoin ETF Flow Analysis ---");
    console.log(`Total Days Tracked: ${data.length}`);
    console.log(`Total Net Inflow: $${(totalInflow / 1_000_000).toFixed(2)} Million`);
    console.log(`Average Daily Flow: $${(avg / 1_000_000).toFixed(2)} Million`);
    console.log(`Positive Days: ${positiveDays}`);
    console.log(`Negative Days: ${negativeDays}`);

    console.log("\nTop 5 Best Inflow Days:");
    sorted.slice(0, 5).forEach((d, i) => {
        console.log(`${i + 1}. ${d.date}: +$${(d.total / 1_000_000).toFixed(2)}M`);
    });

    console.log("\nTop 5 Worst Outflow Days:");
    sorted.slice(-5).reverse().forEach((d, i) => {
        console.log(`${i + 1}. ${d.date}: -$${(Math.abs(d.total) / 1_000_000).toFixed(2)}M`);
    });

    // recent 5 days trend
    console.log("\nRecent 5 Days Flow:");
    data.slice(-5).forEach(d => {
        console.log(`${d.date}: ${d.total > 0 ? '+' : ''}$${(d.total / 1_000_000).toFixed(2)}M`);
    });
}

analyzeData();
