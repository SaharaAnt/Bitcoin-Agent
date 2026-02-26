import googleTrends from 'google-trends-api';

async function test() {
    try {
        const results = await googleTrends.interestOverTime({
            keyword: 'Bitcoin',
            startTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        });
        const parsed = JSON.parse(results);
        console.log(parsed.default.timelineData.slice(-5));
    } catch (e) {
        console.error(e);
    }
}
test();
