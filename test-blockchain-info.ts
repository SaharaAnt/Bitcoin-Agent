async function testBlockchainInfo() {
    console.log("Testing Blockchain.info Reddit Chart...");
    const url = "https://api.blockchain.info/charts/reddit-subscribers?timespan=30days&format=json&cors=true";
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
            console.log("Chart Name:", json.name);
            console.log("Latest Data Point:", json.values[json.values.length - 1]);
        } else {
            const text = await res.text();
            console.error("Response:", text.substring(0, 500));
        }
    } catch (e) {
        console.error("Blockchain.info Fetch Failed:", e);
    }
}

testBlockchainInfo();
