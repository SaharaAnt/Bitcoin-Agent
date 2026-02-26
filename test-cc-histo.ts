async function testCCLast30() {
    console.log("Testing CryptoCompare Historical Social Stats...");
    const url = "https://min-api.cryptocompare.com/data/social/coin/histo/day?fsym=BTC&limit=2";
    try {
        const res = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            },
            signal: AbortSignal.timeout(15000)
        });

        console.log(`Status: ${res.status} ${res.statusText}`);
        if (res.ok) {
            const json = await res.json();
            console.log("Full Data Keys:", Object.keys(json));
            if (json.Data && json.Data.length > 0) {
                console.log("Latest Historical Point Sample:", JSON.stringify(json.Data[json.Data.length - 1], null, 2));
            } else {
                console.log("No Data points found:", json);
            }
        } else {
            console.error("Response Error:", await res.text());
        }
    } catch (e) {
        console.error("Fetch Error:", e);
    }
}

testCCLast30();
