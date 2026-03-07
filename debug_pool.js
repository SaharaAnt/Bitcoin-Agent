async function debugPool() {
    try {
        const TARGET_USDT_POOL_ID = "f981a304-bb6c-45b8-b0c5-fd2f515ad23a";
        const res = await fetch('https://yields.llama.fi/pools');
        const data = await res.json();
        const pool = data.data.find(p => p.pool === TARGET_USDT_POOL_ID);
        console.log(JSON.stringify(pool, null, 2));
    } catch (err) {
        console.error(err);
    }
}

debugPool();
