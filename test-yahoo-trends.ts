import yahooFinance from 'yahoo-finance2';

async function test() {
    try {
        const result = await yahooFinance.quote('BTC-USD');
        console.log(result);
    } catch (e) {
        console.error(e);
    }
}
test();
