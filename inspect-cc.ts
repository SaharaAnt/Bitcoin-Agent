async function inspectCC() {
    console.log("Inspecting CryptoCompare API...");
    const url = "https://min-api.cryptocompare.com/data/social/coin/latest?coinId=1182";
    try {
        const res = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            },
            // Try increasing timeout
            signal: AbortSignal.timeout(15000)
        });

        console.log(`Status: ${res.status} ${res.statusText}`);
        if (res.ok) {
            const json = await res.json();
            console.log("Full Keys:", Object.keys(json));
            if (json.Data) {
                console.log("Data Keys:", Object.keys(json.Data));
                console.log("Reddit Data Sample:", JSON.stringify(json.Data.Reddit, null, 2));
            } else {
                console.log("No Data field found in response:", json);
            }
        } else {
            const text = await res.text();
            console.error("Response Body:", text);
        }
    } catch (e) {
        console.error("Fetch Error:", e);
    }
}

inspectCC();
