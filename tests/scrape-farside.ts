import getBitcoinETFData from 'bitcoin-etf-data';

async function testLib() {
    try {
        console.log("Testing bitcoin-etf-data...");
        // Handle common default export issues in mixed environments
        const fetchFn = typeof getBitcoinETFData === 'function' ? getBitcoinETFData : (getBitcoinETFData as any).default;
        
        if (typeof fetchFn !== 'function') {
            throw new Error(`Export is not a function: ${typeof fetchFn}`);
        }

        const data = await fetchFn();
        console.log("Data from bitcoin-etf-data:", typeof data, Array.isArray(data) ? `Array length: ${data.length}` : typeof data);
        if (data && Array.isArray(data)) {
            console.log("Latest 2 entries:", JSON.stringify(data.slice(-2), null, 2));
        }
    } catch (err: any) {
        console.error("Error with bitcoin-etf-data:", err.message);
    }
}

async function run() {
    await testLib();
}

run();
