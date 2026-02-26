import yahooFinance from "yahoo-finance2";

async function inspectYahoo() {
    console.log("Inspecting Yahoo Finance for BTC-USD...");
    try {
        const quote = await yahooFinance.quote("BTC-USD");
        console.log("Quote keys:", Object.keys(quote));

        // Try to get summary or profile if available
        // Note: yahoo-finance2 module has specific methods
        const summary = await yahooFinance.quoteSummary("BTC-USD", {
            modules: ["summaryDetail", "assetProfile", "defaultKeyStatistics"]
        });
        console.log("Summary modules retrieved:", Object.keys(summary));
        console.log("DefaultKeyStatistics sample:", JSON.stringify(summary.defaultKeyStatistics, null, 2));
    } catch (e) {
        console.error("Yahoo Fetch Failed:", e);
    }
}

inspectYahoo();
