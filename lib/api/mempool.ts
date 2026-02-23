export interface MempoolFees {
    fastestFee: number;
    halfHourFee: number;
    hourFee: number;
    economyFee: number;
    minimumFee: number;
}

export interface BlockStats {
    id: string;
    height: number;
    version: number;
    timestamp: number;
    tx_count: number;
    size: number;
    weight: number;
    merkle_root: string;
    previousblockhash: string;
    mediantime: number;
    nonce: number;
    bits: number;
    difficulty: number;
}

/**
 * Fetches current recommended fees from mempool.space API
 * returns fees in sat/vB
 */
export async function getMempoolRecommendedFees(): Promise<MempoolFees> {
    try {
        const response = await fetch("https://mempool.space/api/v1/fees/recommended");
        if (!response.ok) {
            throw new Error(`Mempool API error: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("[mempool API] fetch error:", error);
        // Fallback default fees
        return {
            fastestFee: 25,
            halfHourFee: 20,
            hourFee: 15,
            economyFee: 10,
            minimumFee: 5,
        };
    }
}

/**
 * Validates if the network is highly congested.
 * An arbitrary threshold can be set. e.g., if fastestFee > 100 sat/vB, network is congested.
 */
export async function getNetworkCongestionStatus(): Promise<{
    isCongested: boolean;
    fees: MempoolFees;
    reasoning: string;
}> {
    const fees = await getMempoolRecommendedFees();
    const isCongested = fees.fastestFee > 50; // Threshold can be adjusted

    let reasoning = "";
    if (isCongested) {
        reasoning = `比特币网络当前拥堵，最快确认费率飙升至 ${fees.fastestFee} sat/vB。如果此时转移资金（如从冷钱包充值或提现）将面临高昂的手续费。建议：尽量避免不必要的链上交互，耐心等待抛售踩踏结束、网络重新空闲。`;
    } else {
        reasoning = `比特币网络当前相对空闲，最快确认费率约 ${fees.fastestFee} sat/vB。`;
    }

    return {
        isCongested,
        fees,
        reasoning,
    };
}
