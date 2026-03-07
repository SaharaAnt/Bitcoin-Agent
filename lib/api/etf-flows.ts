const COINGLASS_BASE = "https://open-api.coinglass.com/public/v2/etf"; // Or v4
// Based on typical v4 API, but let's just make it flexible
const COINGLASS_V4_BASE = "https://open-api-v4.coinglass.com/api";

export async function getBitcoinEtfFlowHistory() {
    const apiKey = process.env.COINGLASS_API_KEY;
    if (!apiKey) {
        throw new Error("COINGLASS_API_KEY is not configured in .env");
    }

    try {
        const res = await fetch(`${COINGLASS_V4_BASE}/etf/bitcoin/flow-history`, {
            headers: {
                "accept": "application/json",
                "CG-API-KEY": apiKey,
            },
            next: { revalidate: 3600 } // Cache for 1 hour
        });

        if (!res.ok) {
            throw new Error(`CoinGlass API error: ${res.statusText}`);
        }

        const json = await res.json();

        if (json.code !== "0") {
            throw new Error(`CoinGlass API returned error code ${json.code}: ${json.msg}`);
        }

        return json.data;
    } catch (err) {
        console.error("Failed to fetch ETF Flow History:", err);
        throw err;
    }
}
