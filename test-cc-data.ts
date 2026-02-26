async function testCryptoCompare() {
    const url = 'https://min-api.cryptocompare.com/data/social/coin/latest?coinId=1182';
    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const json = await res.json();
        console.log('CryptoCompare Reddit Data:', JSON.stringify(json.Data.Reddit, null, 2));
    } catch (e) {
        console.error('CryptoCompare Fetch Failed:', e);
    }
}
testCryptoCompare();
