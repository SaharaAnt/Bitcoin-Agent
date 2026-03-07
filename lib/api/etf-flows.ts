const COINGLASS_BASE = "https://open-api.coinglass.com/public/v2/etf"; // Or v4
// Based on typical v4 API, but let's just make it flexible
const COINGLASS_V4_BASE = "https://open-api-v4.coinglass.com/api";

export async function getBitcoinEtfFlowHistory() {
    const apiKey = process.env.COINGLASS_API_KEY;

    try {
        if (!apiKey) {
            throw new Error("COINGLASS_API_KEY is not configured");
        }

        const res = await fetch(`${COINGLASS_V4_BASE}/etf/bitcoin/flow-history`, {
            headers: {
                "accept": "application/json",
                "CG-API-KEY": apiKey,
            },
            next: { revalidate: 3600 } // Cache for 1 hour
        });

        if (!res.ok) {
            throw new Error(`CoinGlass API HTTP error: ${res.status}`);
        }

        const json = await res.json();

        if (json.code !== "0") {
            throw new Error(`CoinGlass Error ${json.code}: ${json.msg}`);
        }

        return json.data;
    } catch (err: any) {
        console.error("Failed to fetch ETF Flow History (falling back to mock):", err.message);

        // Graceful fallback for demo purposes when API gets paywalled or key is missing
        return {
            isMock: true,
            reason: err.message,
            list: [
                {
                    date: new Date(Date.now() - 86400000 * 2).toISOString(),
                    netflow: 210.5
                },
                {
                    date: new Date(Date.now() - 86400000).toISOString(),
                    netflow: 145.2 // A realistic mock inflow string
                }
            ]
        };
    }
}
