import getBitcoinETFData from 'bitcoin-etf-data';

async function testLib() {
    try {
        console.log("Testing bitcoin-etf-data...");
        const data = await getBitcoinETFData();
        console.log("Data from bitcoin-etf-data:", typeof data, Array.isArray(data) ? data.slice(0, 2) : Object.keys(data).slice(0, 5));
        if (data) {
            console.log("Sample:", JSON.stringify(Array.isArray(data) ? data.slice(-2) : data).slice(0, 500));
        }
    } catch (err: any) {
        console.error("Error with bitcoin-etf-data:", err.message);
    }
}

async function run() {
    await testLib();
}

run();
