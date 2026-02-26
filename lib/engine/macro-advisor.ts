import yahooFinance from "yahoo-finance2";

export type MacroSignal = "easing" | "tightening" | "neutral";

export interface MacroAnalysis {
    signal: MacroSignal;
    signalLabel: string;
    dxy: {
        value: number;
        change: number;
        changePercent: number;
    };
    us10y: {
        value: number;
        change: number;
        changePercent: number;
    };
    reasoning: string[];
    timestamp: string;
}

const SIGNAL_LABELS: Record<MacroSignal, string> = {
    easing: "宏观流动性宽松 (利好BTC) 🌊",
    tightening: "宏观流动性紧缩 (利空BTC) ⚠️",
    neutral: "宏观流动性中性 (变动较小) ⚖️",
};

/**
 * 封装带超时的调用，保护 Vercel 的单次执行
 */
async function fetchQuoteWithTimeout(symbol: string, fallbackValue = 0, timeoutMs = 8000) {
    try {
        const result: any = await Promise.race([
            yahooFinance.quote(symbol),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Timeout")), timeoutMs)
            ),
        ]);

        return {
            value: result.regularMarketPrice ?? fallbackValue,
            change: result.regularMarketChange ?? 0,
            changePercent: result.regularMarketChangePercent ?? 0,
        };
    } catch (err) {
        console.warn(`[macro-advisor] Failed to fetch ${symbol}:`, err);
        return { value: fallbackValue, change: 0, changePercent: 0 };
    }
}

/**
 * 全球宏观流动性分析引擎
 *
 * 核心逻辑：
 * - 结合美联储货币政策预期与比特币流动性的负相关关系。
 * - DXY (美元指数)：走弱代表美元流动性溢出，利好风险资产；走强代表避险情绪或加息预期，利空。
 * - US10Y (10年期美债收益率)：被视为无风险利率基准。下降表示借贷成本降低、降息预期增强，利好 BTC。
 */
export async function analyzeMacroLiquidity(): Promise<MacroAnalysis> {
    // 并行获取美指和十年期美债
    const [dxyData, us10yData] = await Promise.all([
        fetchQuoteWithTimeout("DX-Y.NYB", 104.0), // 美元指数
        fetchQuoteWithTimeout("^TNX", 4.2)        // 10年期美债收益率 (CBOE Interest Rate 10 Year T No)
    ]);

    const reasoning: string[] = [];
    let signal: MacroSignal = "neutral";
    let score = 0; // Negative = Easing (Bullish), Positive = Tightening (Bearish)

    // 分析 10年期美债 (US10Y) 变化
    // US10Y 降低代表市场押注美联储降息或宏观宽松
    if (us10yData.value === 4.2 && us10yData.changePercent === 0) {
        reasoning.push("美债收益率数据获取异常或持平使用默认值估算");
    } else {
        if (us10yData.changePercent < -1.5) {
            score -= 2;
            reasoning.push(`10年期美债收益率大幅回落至 ${us10yData.value.toFixed(2)}% (日内跌幅 ${Math.abs(us10yData.changePercent).toFixed(2)}%)，市场预期美联储降息的鸽派信号强烈，无风险资产吸引力下降`);
        } else if (us10yData.changePercent < -0.5) {
            score -= 1;
            reasoning.push(`10年期美债收益率小幅下行至 ${us10yData.value.toFixed(2)}%，资金借贷成本边际降低`);
        } else if (us10yData.changePercent > 1.5) {
            score += 2;
            reasoning.push(`10年期美债收益率大幅飙升至 ${us10yData.value.toFixed(2)}% (日内涨幅 ${us10yData.changePercent.toFixed(2)}%)，市场担忧美联储因通胀粘性推迟降息 (Higher for Longer)，抽水效应显著`);
        } else if (us10yData.changePercent > 0.5) {
            score += 1;
            reasoning.push(`10年期美债收益率上行至 ${us10yData.value.toFixed(2)}%，宏观流动性呈边际收紧态势`);
        } else {
            reasoning.push(`10年期美债收益率暂稳于 ${us10yData.value.toFixed(2)}%，宏观利率环境观望情绪浓厚`);
        }
    }

    // 分析 美元指数 (DXY) 变化
    // DXY 走低说明美元贬值，全球美元流动性变得充裕，抗通胀资产（如BTC/黄金）价值突显
    if (dxyData.value === 104.0 && dxyData.changePercent === 0) {
        reasoning.push("美元指数数据获取异常或持平使用默认值估算");
    } else {
        if (dxyData.changePercent < -0.5) {
            score -= 2;
            reasoning.push(`美元指数弱势下跌至 ${dxyData.value.toFixed(2)} (日内跌幅 ${Math.abs(dxyData.changePercent).toFixed(2)}%)，美元走弱释放全球流动性，强化了比特币等风险数字资产的对冲价值`);
        } else if (dxyData.changePercent < -0.2) {
            score -= 1;
            reasoning.push(`美元指数微跌至 ${dxyData.value.toFixed(2)}，汇率层面资金流动性温和释放`);
        } else if (dxyData.changePercent > 0.5) {
            score += 2;
            reasoning.push(`美元指数强势上攻至 ${dxyData.value.toFixed(2)} (日内涨幅 ${dxyData.changePercent.toFixed(2)}%)，避险情绪升温或全球资本回流美国本土，对加密资产总体流动性构成严峻压制`);
        } else if (dxyData.changePercent > 0.2) {
            score += 1;
            reasoning.push(`美元指数偏强运行至 ${dxyData.value.toFixed(2)}，美元购买力上升，比特币计价承压`);
        } else {
            reasoning.push(`美元指数横盘于 ${dxyData.value.toFixed(2)}，汇市暂无明确宏观大方向指引`);
        }
    }

    // 综合打分推导 Signal 信号
    if (score <= -2) {
        signal = "easing";
        reasoning.push("宏观总结：股债汇三杀压力减轻，全球流动性显著外溢。资金正主动寻求高弹性抗通胀标的（降息预期红利期），比特币宏观上处于顺风局。");
    } else if (score >= 2) {
        signal = "tightening";
        reasoning.push("宏观总结：流动性收紧与借款成本双高（流动性紧缩）。法币无风险收益吸筹严重，比特币宏观资金面处于逆风局，极易发生获利盘抽水（风险规避/‘卖事实’发生期）。");
    } else {
        signal = "neutral";
        reasoning.push("宏观总结：美联储预期管理博弈中，宏观流动性处于中性区间带。资产价格更多受技术面或加密市场内存量资金及 ETF 净流入主导。");
    }

    return {
        signal,
        signalLabel: SIGNAL_LABELS[signal],
        dxy: {
            value: Number(dxyData.value.toFixed(3)),
            change: Number(dxyData.change.toFixed(3)),
            changePercent: Number(dxyData.changePercent.toFixed(2)),
        },
        us10y: {
            value: Number(us10yData.value.toFixed(3)),
            change: Number(us10yData.change.toFixed(3)),
            changePercent: Number(us10yData.changePercent.toFixed(2)),
        },
        reasoning,
        timestamp: new Date().toISOString(),
    };
}
