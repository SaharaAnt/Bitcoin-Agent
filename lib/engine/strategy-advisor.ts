import { getBtcCurrentPrice } from "../api/coingecko";
import { getFearGreedCurrent, getFearGreedHistory } from "../api/fear-greed";

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
    change24h: number
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
    change24h: number
): MarketAnalysis["suggestion"] {
    const reasoning: string[] = [];

    let frequency = "weekly";
    let fearThreshold = 25;
    let greedThreshold = 75;
    let fearMultiplier = 2.0;
    let greedMultiplier = 0.5;

    switch (signal) {
        case "strong_buy":
            frequency = "daily";
            fearThreshold = 30;
            fearMultiplier = 3.0;
            greedMultiplier = 0.5;
            reasoning.push(`恐惧贪婪指数仅 ${fgiValue}，市场极度恐惧`);
            reasoning.push("建议提高定投频率至每日，并加大恐惧加仓倍数至 3x");
            if (change24h <= -5) {
                reasoning.push(
                    `BTC 24h 下跌 ${Math.abs(change24h).toFixed(1)}%，短期恐慌加剧，历史上是好的买入机会`
                );
            }
            break;

        case "buy":
            frequency = "weekly";
            fearThreshold = 25;
            fearMultiplier = 2.0;
            greedMultiplier = 0.5;
            reasoning.push(`FGI ${fgiValue}，市场处于恐惧区间`);
            reasoning.push("建议维持周定投，恐惧加仓 2x");
            if (fgiTrend === "falling") {
                reasoning.push("FGI 近 7 天持续下降，恐惧情绪加深，可适当加仓");
            }
            break;

        case "neutral":
            frequency = "weekly";
            fearThreshold = 25;
            greedThreshold = 75;
            fearMultiplier = 2.0;
            greedMultiplier = 0.5;
            reasoning.push(`FGI ${fgiValue}，市场情绪中性`);
            reasoning.push("保持默认定投策略即可，无需调整");
            break;

        case "reduce":
            frequency = "biweekly";
            greedThreshold = 70;
            fearMultiplier = 1.5;
            greedMultiplier = 0.3;
            reasoning.push(`FGI ${fgiValue}，市场偏贪婪`);
            reasoning.push("建议降低频率至双周，贪婪减仓至 0.3x");
            if (fgiTrend === "rising") {
                reasoning.push("FGI 趋势上升，贪婪情绪可能进一步加剧");
            }
            break;

        case "strong_reduce":
            frequency = "monthly";
            greedThreshold = 65;
            fearMultiplier = 1.0;
            greedMultiplier = 0.2;
            reasoning.push(`FGI 高达 ${fgiValue}，市场极度贪婪`);
            reasoning.push(
                "建议将定投频率降至每月，贪婪减仓至 0.2x，保留现金等待回调"
            );
            reasoning.push("历史上极度贪婪往往伴随短期顶部");
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
    const [btcData, fgiCurrent, fgiHistory] = await Promise.all([
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
    ]);

    // If both APIs failed, return a "data unavailable" analysis
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
                reasoning: ["无法获取市场数据，建议保持默认定投策略", "请检查网络连接后重试"],
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
        btcData.change24h
    );

    const suggestion = generateSuggestion(
        signal,
        fgiCurrent.value,
        trend,
        btcData.change24h
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
        suggestion,
        confidence,
        timestamp: new Date().toISOString(),
    };
}
