import "dotenv/config";
import { generateBtcRiskReport } from "../lib/engine/risk-report";

async function main() {
    try {
        const report = await generateBtcRiskReport();
        console.log("Success! Generated Report:", JSON.stringify(report, null, 2));
    } catch (e) {
        console.error("Error generating risk report:", e);
    }
}

main();
