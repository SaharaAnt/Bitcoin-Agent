import { calculateAhr999, calculateAhr999History } from "../lib/engine/ahr999";
import dotenv from "dotenv";

dotenv.config();

async function main() {
    console.log("Testing calculateAhr999()...");
    try {
        const data = await calculateAhr999();
        console.log("calculateAhr999 result:", JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("calculateAhr999 failed:", error);
    }

    console.log("\nTesting calculateAhr999History(30)...");
    try {
        const history = await calculateAhr999History(30);
        console.log(`calculateAhr999History returned ${history.length} points.`);
        if (history.length > 0) {
            console.log("First point:", JSON.stringify(history[0], null, 2));
        }
    } catch (error) {
        console.error("calculateAhr999History failed:", error);
    }
}

main();
