import { getBtcDailyPrices } from "./coingecko";
import { getFearGreedCurrent } from "./fear-greed";
import { getMvrvData } from "./mvrv";
import etfData from "../data/farside-data.json";

export interface MacroLiquidityData {
    institutionalInflowM: number;
    institutionalSentiment: "Strong Buy" | "Weak Buy" | "Neutral" | "Weak Sell" | "Strong Sell";
    estimatedSellingPressure: "Low" | "Moderate" | "High" | "Extreme (Capitulation)";
    drawdownFromPeak: number;
    reboundFromBottom: number;
    fgiValue: number;
    mvrvZScore: number;
    netLiquidityBalance: string;
    agentActionableAdvice: string;
}

export async function getMacroLiquidityData(): Promise<MacroLiquidityData> {
    const now = new Date();
    // Fetch last 120 days for a medium-term view
    const fromDate = new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000);
    
    // Fetch all necessary data concurrently
    const [prices, fgi, mvrv] = await Promise.all([
        getBtcDailyPrices(fromDate, now),
        getFearGreedCurrent(),
        getMvrvData()
    ]);

    // 1. Analyze Price Action (Drawdown and Rebound)
    let peakPrice = 0;
    let bottomPriceAfterPeak = Infinity;
    const currentPrice = prices.length > 0 ? prices[prices.length - 1].price : 0;

    for (const p of prices) {
        if (p.price > peakPrice) {
            peakPrice = p.price;
            bottomPriceAfterPeak = p.price; // Reset bottom after new peak
        }
        if (p.price < bottomPriceAfterPeak) {
            bottomPriceAfterPeak = p.price;
        }
    }

    const drawdownFromPeak = peakPrice > 0 ? ((currentPrice - peakPrice) / peakPrice) * 100 : 0;
    const reboundFromBottom = bottomPriceAfterPeak > 0 ? ((currentPrice - bottomPriceAfterPeak) / bottomPriceAfterPeak) * 100 : 0;
    const maxDrawdown = peakPrice > 0 ? ((bottomPriceAfterPeak - peakPrice) / peakPrice) * 100 : 0;

    // 2. Estimate "Whale Capitulation" Selling Pressure Proxy
    // Logic: If the market had a severe drop (e.g. >30%) and is currently rebounding (e.g. >10%),
    // people who bought at the peak 6-12 months ago will use this liquidity exit to sell at a loss (Realized Loss).
    let sellingPressure: MacroLiquidityData["estimatedSellingPressure"] = "Low";
    
    if (maxDrawdown <= -40 && reboundFromBottom >= 15) {
        sellingPressure = "Extreme (Capitulation)";  // Dropped 40%+, now rebounding 15%+
    } else if (maxDrawdown <= -25 && reboundFromBottom >= 10) {
        sellingPressure = "High"; // Dropped 25%+, now rebounding 10%+
    } else if (maxDrawdown <= -15 && reboundFromBottom >= 5) {
        sellingPressure = "Moderate";
    }

    // 3. Analyze Institutional Purchasing Power (ETF Flows)
    const validEtfData = (etfData as { date: string; total: number }[]).filter(d => !isNaN(d.total));
    const recent5Days = validEtfData.slice(-5);
    const sum5Days = recent5Days.reduce((sum, d) => sum + d.total, 0) / 1_000_000; // in Millions

    let instSentiment: MacroLiquidityData["institutionalSentiment"] = "Neutral";
    if (sum5Days > 1000) instSentiment = "Strong Buy";
    else if (sum5Days > 200) instSentiment = "Weak Buy";
    else if (sum5Days < -500) instSentiment = "Strong Sell";
    else if (sum5Days < -100) instSentiment = "Weak Sell";

    // 4. Net Liquidity Balance
    let netBalance = "";
    let advice = "";

    if (sellingPressure === "Extreme (Capitulation)" || sellingPressure === "High") {
        if (instSentiment === "Strong Buy") {
            netBalance = "Institutions Absorbing Capitulation (机构正强力吸收散户/巨鲸割肉盘)";
            advice = "市场正面临极大的解套和割肉抛压，但 MSTR/ETF 这种无情买盘提供了强力流动性底。如机构买盘持续，这是筹码换手的筑底期。但需警惕买盘突然枯竭。";
        } else {
            netBalance = "Supply Overwhelming Demand (抛压远大于买盘支撑)";
            advice = "警告：市场正在反弹诱多，但深跌后的巨鲸割肉盘汹涌，而近期 ETF/机构资金净流入疲软，当前流动性极有可能无法承受巨量抛压，反弹随时可能夭折并引发二次探底。";
        }
    } else {
        if (instSentiment === "Strong Buy" || instSentiment === "Weak Buy") {
            netBalance = "Demand Driving Price (需求驱动)";
            advice = "上方没有极端套牢盘抛压，且机构资金呈净流入，市场处于健康的买方主导局面。";
        } else if (fgi.value < 30) {
            netBalance = "Low Liquidity Consolidation (低流动性缩量震荡)";
            advice = "抛压不大，但也缺乏增量资金，市场受情绪主导处于恐慌震荡状态，适合用定投收集廉价筹码。";
        } else {
            netBalance = "Neutral (博弈平衡)";
            advice = "买卖双方力量相对均衡，建议维持标准定投纪律观察。";
        }
    }

    return {
        institutionalInflowM: Math.round(sum5Days),
        institutionalSentiment: instSentiment,
        estimatedSellingPressure: sellingPressure,
        drawdownFromPeak: Math.round(drawdownFromPeak * 100) / 100,
        reboundFromBottom: Math.round(reboundFromBottom * 100) / 100,
        fgiValue: fgi.value,
        mvrvZScore: mvrv.zScore,
        netLiquidityBalance: netBalance,
        agentActionableAdvice: advice
    };
}
