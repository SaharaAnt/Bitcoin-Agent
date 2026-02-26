import googleTrends from "google-trends-api";

async function testTrendsReddit() {
    console.log("Testing Google Trends for 'r/Bitcoin'...");
    try {
        const result = await googleTrends.interestOverTime({
            keyword: "r/Bitcoin",
            startTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        });
        const parsed = JSON.parse(result);
        const timeline = parsed.default.timelineData;
        console.log("Timeline points found:", timeline.length);
        if (timeline.length > 0) {
            console.log("Latest Value:", timeline[timeline.length - 1].value[0]);
        }
    } catch (e) {
        console.error("Trends Fetch Failed:", e);
    }
}

testTrendsReddit();
