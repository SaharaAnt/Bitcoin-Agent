async function testReddit() {
    try {
        const res = await fetch('https://www.reddit.com/r/Bitcoin/about.json', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.37 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.37'
            }
        });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const json = await res.json();
        console.log('Subscribers:', json.data.subscribers);
        console.log('Active Users:', json.data.accounts_active);
    } catch (e) {
        console.error('Reddit Fetch Failed:', e);
    }
}
testReddit();
