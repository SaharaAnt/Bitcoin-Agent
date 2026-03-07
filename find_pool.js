async function findPool() {
    try {
        const res = await fetch('https://yields.llama.fi/pools');
        const data = await res.json();
        const pools = data.data.filter(p =>
            p.symbol === 'USDT' &&
            p.chain === 'Ethereum' &&
            p.project === 'aave-v3'
        );
        console.log(JSON.stringify(pools, null, 2));
    } catch (err) {
        console.error(err);
    }
}

findPool();
