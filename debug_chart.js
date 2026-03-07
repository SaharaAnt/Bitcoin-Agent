async function debugChart() {
    try {
        const TARGET_USDT_POOL_ID = "f981a304-bb6c-45b8-b0c5-fd2f515ad23a";
        const res = await fetch(`https://yields.llama.fi/chartLendBorrow/${TARGET_USDT_POOL_ID}`);
        const data = await res.json();
        const latest = data.data[data.data.length - 1];
        console.log("Latest chart data point:");
        console.log(JSON.stringify(latest, null, 2));
    } catch (err) {
        console.error(err);
    }
}

debugChart();
