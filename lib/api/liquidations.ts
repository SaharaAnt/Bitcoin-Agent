/**
 * In a real-world scenario, you would fetch exchange liquidations from services like Coinglass, Binance API, or similar providers.
 * Due to the lack of generic free open APIs with historical deep dive, we'll build a smart mock based on actual market sentiment and price.
 * 
 * If the FGI < 25 and BTC dropped > 5% in 24h, we simulate a "Long Squeeze" (Long Liquidations spike).
 * If the FGI > 75 and BTC pumped > 5% in 24h, we simulate a "Short Squeeze" (Short Liquidations spike).
 */

export interface LiquidationData {
    timestamp: number;
    totalLiquidationsUSD: number; // in millions
    longLiquidationsUSD: number;
    shortLiquidationsUSD: number;
    dominantSide: "LONG" | "SHORT" | "NEUTRAL";
    reasoning: string;
}

export async function getMockedLiquidations(
    fgiValue: number,
    priceChange24h: number
): Promise<LiquidationData> {

    let total = 0;
    let longs = 0;
    let shorts = 0;
    let dominant: "LONG" | "SHORT" | "NEUTRAL" = "NEUTRAL";
    let reasoning = "";

    // Dramatic Drop
    if (priceChange24h <= -10 || fgiValue <= 15) {
        total = Math.floor(Math.random() * 500) + 600; // 600M+
        longs = Math.floor(total * (0.85 + Math.random() * 0.1)); // 85-95% longs
        shorts = total - longs;
        dominant = "LONG";
        reasoning = `过去24小时全网爆仓超 ${total} 亿美元，其中多单惨遭血洗（超 ${(longs / total * 100).toFixed(1)}% 多单爆仓）。典型的巨鲸砸盘引发杠杆清算连环踩踏。恐慌抛售通常是历史级别的买入机会。`;

    } else if (priceChange24h <= -5 || fgiValue <= 35) {
        // Mild drop
        total = Math.floor(Math.random() * 200) + 200; // 200M - 400M
        longs = Math.floor(total * (0.7 + Math.random() * 0.2)); // 70-90% longs
        shorts = total - longs;
        dominant = "LONG";
        reasoning = `24小时清算量约为 ${total} 亿美元，多头遭到集中清算，属于健康的去杠杆过程。`;

    } else if (priceChange24h >= 10 || fgiValue >= 80) {
        // Huge pump
        total = Math.floor(Math.random() * 500) + 500;
        shorts = Math.floor(total * (0.8 + Math.random() * 0.1));
        longs = total - shorts;
        dominant = "SHORT";
        reasoning = `过去24小时全网爆仓超 ${total} 亿美元，空头惨遭轧空（Short Squeeze）。市场处于极度FOMO状态。`;

    } else {
        // Normal day
        total = Math.floor(Math.random() * 100) + 50;
        longs = Math.floor(total * 0.5);
        shorts = total - longs;
        dominant = "NEUTRAL";
        reasoning = `近日爆仓量保持在较低的日均水平（${total} 亿美元），多空力量相对均衡，盘面较为平稳。`;
    }

    return {
        timestamp: Date.now(),
        totalLiquidationsUSD: total,
        longLiquidationsUSD: longs,
        shortLiquidationsUSD: shorts,
        dominantSide: dominant,
        reasoning,
    };
}
