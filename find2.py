import urllib.request, json

url = 'https://yields.llama.fi/pools'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        pools = [p for p in data['data'] if 'BTC' in str(p.get('symbol', '')).upper() and p.get('apyBaseBorrow') is not None and float(p.get('apyBaseBorrow', 0)) > 0]
        pools.sort(key=lambda x: float(x.get('tvlUsd', 0)), reverse=True)
        for p in pools[:5]:
            print(f"{p.get('project')} ({p.get('chain')}) - {p.get('symbol')}")
            print(f"Borrow: {p.get('apyBaseBorrow')} | Supply: {p.get('apyBase')} | TVL: ${float(p.get('tvlUsd', 0))/1e6:.1f}M")
            print(f"ID: {p.get('pool')}\n---")
except Exception as e:
    print(f"Error: {e}")
