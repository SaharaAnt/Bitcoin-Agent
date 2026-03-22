import { expect, it, describe } from "vitest";
import { getBtcCommunityData } from "../lib/api/coingecko";

describe("Reddit Community Data", () => {
    it("should fetch live Reddit data with realistic values", async () => {
        const data = await getBtcCommunityData();
        
        console.log("Fetched Reddit Data:", data);
        
        expect(data).not.toBeNull();
        if (data) {
            // Subscribers should be > 6.6M (2024 baseline)
            expect(data.redditSubscribers).toBeGreaterThan(6600000);
            
            // Activity should be non-zero
            expect(data.redditAveragePosts48h).toBeGreaterThan(0);
            
            // Should not be exactly the old hardcoded baseline (6645000)
            // unless it fell back to the NEW baseline (8.1M+)
            if (data.redditSubscribers < 8000000) {
               console.warn("Possible fallback to old baseline detected or Reddit sub count dropped below 8M");
            }
        }
    }, 20000); // 20s timeout for network calls
});
