import { getBtcCurrentPrice } from "../api/coingecko";
import { getFearGreedCurrent, getFearGreedHistory } from "../api/fear-greed";
import { getMvrvData, MvrvData } from "../api/mvrv";
import marketInsights from "../data/market-insights.json";

export type Signal =
    | "strong_buy"
    | "buy"
    | "neutral"
    | "reduce"
    | "strong_reduce";

export interface MarketAnalysis {
    signal: Signal;
    signalLabel: string;
    fgi: {
        value: number;
        label: string;
        trend: "falling" | "rising" | "stable";
        avg7d: number;
    };
    btc: {
        price: number;
        change24h: number;
    };
    mvrv?: MvrvData; // Add MVRV to analysis result
    suggestion: {
        frequency: string;
        fearThreshold: number;
        greedThreshold: number;
        fearMultiplier: number;
        greedMultiplier: number;
        reasoning: string[];
    };
    confidence: number;
    timestamp: string;
}

const SIGNAL_LABELS: Record<Signal, string> = {
    strong_buy: "强烈买入 🟢🟢",
    buy: "建议加仓 🟢",
    neutral: "正常定投 🟡",
    reduce: "建议减仓 🟠",
    strong_reduce: "建议暂停 🔴",
};

function computeFgiTrend(history: { value: number }[]): {
    trend: "falling" | "rising" | "stable";
    avg7d: number;
} {
    if (history.length < 2) {
        return { trend: "stable", avg7d: history[0]?.value ?? 50 };
    }

    const recent = history.slice(0, 7);
    const avg7d =
        recent.reduce((sum, d) => sum + d.value, 0) / recent.length;

    // Compare first half vs second half of 7-day window
    const firstHalf = recent.slice(0, Math.ceil(recent.length / 2));
    const secondHalf = recent.slice(Math.ceil(recent.length / 2));
    const avgFirst =
        firstHalf.reduce((s, d) => s + d.value, 0) / firstHalf.length;
    const avgSecond =
        secondHalf.reduce((s, d) => s + d.value, 0) / secondHalf.length;

    const diff = avgFirst - avgSecond;
    const trend =
        diff < -5 ? "rising" : diff > 5 ? "falling" : "stable";

    return { trend, avg7d: Math.round(avg7d) };
}

function analyzeSignal(
    fgiValue: number,
    fgiTrend: "falling" | "rising" | "stable",
    change24h: number,
    mvrvZScore: number
): { signal: Signal; confidence: number } {
    let score = 0; // negative = buy, positive = reduce

    // FGI base score (-40 to +40)
    if (fgiValue <= 20) score -= 40;
    else if (fgiValue <= 35) score -= 25;
    else if (fgiValue <= 45) score -= 10;
    else if (fgiValue <= 55) score += 0;
    else if (fgiValue <= 70) score += 10;
    else if (fgiValue <= 80) score += 25;
    else score += 40;

    // MVRV Z-Score modifier (-30 to +30)
    if (mvrvZScore <= -2) score -= 30;
    else if (mvrvZScore <= -1) score -= 20;
    else if (mvrvZScore <= -0.5) score -= 10;
    else if (mvrvZScore >= 7) score += 30;
    else if (mvrvZScore >= 3) score += 20;
    else if (mvrvZScore >= 1) score += 10;

    // Trend modifier (-10 to +10)
    if (fgiTrend === "falling") score -= 10;
    else if (fgiTrend === "rising") score += 10;

    // 24h price crash bonus
    if (change24h <= -10) score -= 15;
    else if (change24h <= -5) score -= 8;
    else if (change24h >= 10) score += 10;

    // Map score to signal
    let signal: Signal;
    if (score <= -30) signal = "strong_buy";
    else if (score <= -10) signal = "buy";
    else if (score <= 10) signal = "neutral";
    else if (score <= 30) signal = "reduce";
    else signal = "strong_reduce";

    // Confidence based on how extreme the score is
    const confidence = Math.min(95, 50 + Math.abs(score));

    return { signal, confidence };
}

function generateSuggestion(
    signal: Signal,
    fgiValue: number,
    fgiTrend: string,
    change24h: number,
    mvrv?: MvrvData
): MarketAnalysis["suggestion"] {
    const reasoning: string[] = [];

    let frequency = "weekly";
    let fearThreshold = 25;
    let greedThreshold = 75;
    let fearMultiplier = 2.0;
    let greedMultiplier = 0.5;

    // 1. MVRV & NUPL specific reasoning (User requested models)
    if (mvrv) {
        if (mvrv.priceLevels) {
            const currentPrice = mvrv.currentPrice;
            const z = mvrv.zScore;
            const { fairValue, bottom } = mvrv.priceLevels;

            if (z >= -0.6 && z <= -0.4) {
                reasoning.push(`BTC 正在反复尝试突破 MVRV 绿线 (${z.toFixed(2)} std / $${fairValue.toLocaleString()})，这是关键中短期阻力/支撑位`);
            }

            if (currentPrice <= bottom * 1.05) {
                reasoning.push(`价格已接近 MVRV 蓝线（$${bottom.toLocaleString()}），大级别底部特征明显`);
            }
        }

        // Investor Confidence (NUPL) reasoning
        if (mvrv.nupl <= -0.2) {
            reasoning.push(`投资者信心指数现极端负值 (${mvrv.nupl})，“物极必反”，历史上此类深坑往往孕育暴力反弹`);
        } else if (mvrv.nupl < 0 && mvrv.bullCountdown) {
            reasoning.push(`信心指数正向零轴靠近，按近期速度，预计约 ${mvrv.bullCountdown.daysToZero} 天重回零轴（牛市起始信号）`);
        } else if (mvrv.nupl >= 0 && mvrv.nupl < 0.1) {
            reasoning.push("信心指数已站上零轴，市场进入初步复苏/牛市早期阶段");
        }
    }

    // 2. Integration of Expert Insights (Glassnode, Gamma, Polymarket)
    const currentPrice = mvrv?.currentPrice || 0;
    if (currentPrice > 0) {
        // Gamma Wall Check
        marketInsights.technicalInsights.forEach(insight => {
            if (insight.metric === "Negative Gamma Wall" && insight.insight.includes("$75k")) {
                const distance = Math.abs(currentPrice - 75000);
                if (distance < 3000) {
                    reasoning.push(`注意：价格接近 $75k Gamma 墙，预计波动性将大幅上升，突破即起飞，下穿即狠砸`);
                }
            }
            if (insight.metric === "Realized Price & Churn") {
                if (currentPrice > 59000 && currentPrice < 72000) {
                    reasoning.push(`当前处于 $59k–$72k “低阻力上行通道”，上方砸盘压力较小`);
                }
            }
        });
    }

    switch (signal) {
        case "strong_buy":
            frequency = "daily";
            fearThreshold = 30;
            fearMultiplier = 3.0;
            greedMultiplier = 0.5;
            reasoning.push(`综合评估显示当前为极佳买入点`);
            if (mvrv && mvrv.zScore <= -1) reasoning.push(`MVRV Z-Score (${mvrv.zScore}) 处于历史极度低估区间`);
            break;

        case "buy":
            frequency = "weekly";
            fearThreshold = 25;
            fearMultiplier = 2.0;
            greedMultiplier = 0.5;
            reasoning.push(`情绪与估值协同指示加仓机会`);
            break;

        case "neutral":
            frequency = "weekly";
            reasoning.push("市场处于合理估值区间，保持纪律定投");
            if (mvrv && mvrv.zScore >= -0.6 && mvrv.zScore <= -0.4) {
                reasoning.push("技术面遇阻 MVRV 绿线，短线不恋战，等待趋势明朗");
            }
            break;

        case "reduce":
            frequency = "biweekly";
            greedMultiplier = 0.3;
            reasoning.push(`市场情绪偏温和贪婪，建议适度收紧策略`);
            break;

        case "strong_reduce":
            frequency = "monthly";
            greedMultiplier = 0.2;
            reasoning.push("估值过高且情绪过热，建议大幅收缩，保留现金回补");
            break;
    }

    return {
        frequency,
        fearThreshold,
        greedThreshold,
        fearMultiplier,
        greedMultiplier,
        reasoning,
    };
}

async function fetchWithTimeout<T>(
    fn: () => Promise<T>,
    fallback: T,
    timeoutMs = 8000
): Promise<T> {
    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        const result = await Promise.race([
            fn(),
            new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error("Timeout")), timeoutMs)
            ),
        ]);
        clearTimeout(timer);
        return result;
    } catch (err) {
        console.warn("[strategy-advisor] API call failed, using fallback:", err);
        return fallback;
    }
}

export async function analyzeMarketConditions(): Promise<MarketAnalysis> {
    const [btcData, fgiCurrent, fgiHistory, mvrv] = await Promise.all([
        fetchWithTimeout(
            () => getBtcCurrentPrice(),
            { price: 0, change24h: 0, marketCap: 0 }
        ),
        fetchWithTimeout(
            () => getFearGreedCurrent(),
            { value: 50, label: "Neutral", timestamp: Date.now(), date: new Date().toISOString().split("T")[0] }
        ),
        fetchWithTimeout(
            () => getFearGreedHistory(7),
            []
        ),
        fetchWithTimeout(
            () => getMvrvData(),
            null
        ),
    ]);

    // If major APIs failed, return a "data unavailable" analysis
    if (btcData.price === 0 && fgiCurrent.value === 50 && fgiHistory.length === 0) {
        return {
            signal: "neutral",
            signalLabel: "数据不可用 ⚠️",
            fgi: { value: 0, label: "Unknown", trend: "stable", avg7d: 0 },
            btc: { price: 0, change24h: 0 },
            suggestion: {
                frequency: "weekly",
                fearThreshold: 25,
                greedThreshold: 75,
                fearMultiplier: 2.0,
                greedMultiplier: 0.5,
                reasoning: ["无法获取市场数据，建议保持默认定投策略"],
            },
            confidence: 0,
            timestamp: new Date().toISOString(),
        };
    }

    const { trend, avg7d } = computeFgiTrend(
        fgiHistory.length > 0 ? fgiHistory : [fgiCurrent]
    );
    
    const { signal, confidence } = analyzeSignal(
        fgiCurrent.value,
        trend,
        btcData.change24h,
        mvrv?.zScore ?? 0
    );

    const suggestion = generateSuggestion(
        signal,
        fgiCurrent.value,
        trend,
        btcData.change24h,
        mvrv || undefined
    );

    return {
        signal,
        signalLabel: SIGNAL_LABELS[signal],
        fgi: {
            value: fgiCurrent.value,
            label: fgiCurrent.label,
            trend,
            avg7d,
        },
        btc: {
            price: btcData.price,
            change24h: btcData.change24h,
        },
        mvrv: mvrv || undefined,
        suggestion,
        confidence,
        timestamp: new Date().toISOString(),
    };
}
