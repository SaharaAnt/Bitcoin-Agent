const COINGECKO_BASE = "https://api.coingecko.com/api/v3";

async function testCommunityData() {
    const url = `${COINGECKO_BASE}/coins/bitcoin?localization=false&tickers=false&market_data=false&community_data=true&developer_data=false&sparkline=false`;

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        console.log('Community Data Structure:', JSON.stringify(data.community_data, null, 2));
    } catch (e) {
        console.error('Fetch Failed:', e);
    }
}
testCommunityData();
