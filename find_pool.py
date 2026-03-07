import urllib.request, json

url = 'https://yields.llama.fi/pools'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as response:
        print("Downloaded. Parsing JSON...")
        data = json.loads(response.read().decode())
        print("Filtering pools...")
        pools = [p for p in data['data'] if ('WBTC' in p['symbol'] or 'BTCB' in p['symbol']) and p.get('apyBaseBorrow', 0) > 0 and p.get('tvlUsd', 0) > 10000000]
        pools.sort(key=lambda x: x['tvlUsd'], reverse=True)
        for p in pools[:5]:
            print(f"{p['project']} ({p['chain']}) - {p['symbol']}")
            print(f"Borrow: {p.get('apyBaseBorrow')} | Supply: {p.get('apyBase')} | TVL: ${p.get('tvlUsd')/1e6:.1f}M")
            print(f"ID: {p['pool']}\n---")
except Exception as e:
    print(f"Error: {e}")
