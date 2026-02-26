import { getBtcCommunityData } from "./lib/api/coingecko";

async function verifyFix() {
    console.log("Starting Reddit data verification...");
    try {
        const data = await getBtcCommunityData();
        if (data) {
            console.log("Successfully retrieved Reddit data:");
            console.log(`- Subscribers: ${(data.redditSubscribers / 1e6).toFixed(2)}M`);
            console.log(`- Active Accounts: ${data.redditActiveAccounts}`);
            console.log(`- Avg Posts (48h/Daily proxy): ${data.redditAveragePosts48h}`);
        } else {
            console.error("Failed to retrieve Reddit data from all sources.");
        }
    } catch (e) {
        console.error("Verification failed with error:", e);
    }
}

verifyFix();
