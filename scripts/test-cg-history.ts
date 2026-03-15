const { getBtcDailyPrices } = require("../lib/api/coingecko");
const dotenv = require("dotenv");

dotenv.config();

async function test() {
    process.env.TS_NODE_PROJECT = "tsconfig.json";
    console.log("Environment variables:");
    console.log("HTTPS_PROXY:", process.env.HTTPS_PROXY);
    console.log("COINGECKO_API_KEY:", process.env.COINGECKO_API_KEY ? "Set" : "Not set");

    const end = new Date();
    const days = 365;
    const start = new Date(end.getTime() - (days + 220) * 24 * 60 * 60 * 1000);
    
    console.log(`Testing getBtcDailyPrices from ${start.toISOString()} to ${end.toISOString()}...`);
    
    try {
        const prices = await getBtcDailyPrices(start, end);
        console.log(`Success! Received ${prices.length} daily price points.`);
        if (prices.length > 0) {
            console.log("First point:", prices[0]);
            console.log("Last point:", prices[prices.length - 1]);
        }
    } catch (error) {
        console.error("Test failed:", error);
    }
}

test();
