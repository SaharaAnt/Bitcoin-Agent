async function testRedditRobust() {
    console.log("Testing Reddit about.json with robust headers...");
    const url = "https://www.reddit.com/r/Bitcoin/about.json";
    try {
        const res = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "application/json",
                "Accept-Language": "en-US,en;q=0.9",
                "Cache-Control": "no-cache"
            },
            signal: AbortSignal.timeout(15000)
        });

        console.log(`Status: ${res.status} ${res.statusText}`);
        if (res.ok) {
            const json = await res.json();
            console.log("Subscribers:", json.data.subscribers);
            console.log("Active Users:", json.data.accounts_active);
        } else {
            const text = await res.text();
            console.error("Response:", text.substring(0, 500));
        }
    } catch (e) {
        console.error("Reddit Fetch Failed:", e);
    }
}

testRedditRobust();
