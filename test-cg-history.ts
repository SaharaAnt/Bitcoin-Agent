import { getBtcCommunityData } from "./lib/api/coingecko";

async function testHistory() {
    const COINGECKO_BASE = "https://api.coingecko.com/api/v3";
    const date = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    const dateStr = `${dd}-${mm}-${yyyy}`;

    const url = `${COINGECKO_BASE}/coins/bitcoin/history?date=${dateStr}&localization=false`;

    try {
        const res = await fetch(url);
        const json = await res.json();
        console.log(`Subscribers on ${dateStr}:`, json.community_data?.reddit_subscribers);
    } catch (e) {
        console.error('History Fetch Failed:', e);
    }
}
testHistory();
