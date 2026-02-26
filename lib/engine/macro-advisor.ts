import yahooFinance from "yahoo-finance2";
import googleTrends from "google-trends-api";


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
    impliedFedRate: {
        value: number;
        changeBps: number;
    };
    retailSentiment: {
        trend: "spiking" | "cooling" | "flat";
        value: number; // 0-100 近期平均热度
        timeline: Array<{ date: string; value: number }>;
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
 * 封装 Google Trends API 获取比特币搜索热度
 * 返回最近 3 天的均值（近期）和过去 14 天的均值（基准），用于判断散户 FOMO
 */
async function fetchGoogleTrends(keyword: string = "Bitcoin") {
    try {
        const result: any = await Promise.race([
            googleTrends.interestOverTime({
                keyword: ["Bitcoin", "Buy Bitcoin", "Crypto"], // 拓展关键词
                startTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 过去 30 天
            }),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Google Trends Timeout")), 8000)
            ),
        ]);

        const parsed = JSON.parse(result);
        const timeline = parsed.default.timelineData;

        if (!timeline || timeline.length === 0) {
            return { recentAvg: 50, trend: "flat" as const, timeline: [], valid: false };
        }

        // 提取数据点，如果有多个关键词，取均值或第一个（Bitcoin）
        const formattedTimeline = timeline.map((d: any) => ({
            date: new Date(Number(d.time) * 1000).toISOString().split('T')[0],
            value: Number(d.value[0]) // 主索引设为 Bitcoin
        }));

        const values = formattedTimeline.map((d: { value: number }) => d.value);
        const last3DaysAvg = values.slice(-3).reduce((a: number, b: number) => a + b, 0) / 3;
        const previous27DaysAvg = values.slice(0, -3).reduce((a: number, b: number) => a + b, 0) / (values.length - 3);

        let trend: "spiking" | "cooling" | "flat" = "flat";
        if (last3DaysAvg > previous27DaysAvg * 1.3) trend = "spiking";
        else if (last3DaysAvg < previous27DaysAvg * 0.7) trend = "cooling";

        return {
            recentAvg: Math.round(last3DaysAvg),
            trend,
            timeline: formattedTimeline,
            valid: true
        };
    } catch (err) {
        console.warn(`[macro-advisor] Failed to fetch google trends:`, err);
        return { recentAvg: 50, trend: "flat" as const, timeline: [], valid: false };
    }
}

/**
 * 全球宏观流动性分析引擎
 *
 * 核心逻辑：
 * - 结合美联储货币政策预期与比特币流动性的负相关关系。
 * - DXY (美元指数)：走弱代表美元流动性溢出，利好风险资产；走强代表避险情绪或加息预期，利空。
 * - US10Y (10年期美债收益率)：被视为无风险利率基准。下降表示借贷成本降低、降息预期增强，利好 BTC。
 * - Google Trends (Retail Sentiment): 散户搜索量。如果在高位飙升防散户接盘(利空)，如果极度冷却说明洗盘充分(利好)。
 */
export async function analyzeMacroLiquidity(): Promise<MacroAnalysis> {
    // 并行获取美指、十年期美债、联邦基金利率期货数据和谷歌搜索热度
    const [dxyData, us10yData, zqData, trendsData] = await Promise.all([
        fetchQuoteWithTimeout("DX-Y.NYB", 104.0), // 美元指数
        fetchQuoteWithTimeout("^TNX", 4.2),       // 10年期美债收益率
        fetchQuoteWithTimeout("ZQ=F", 95.38),     // 30天联邦基金利率期货 (默认为 95.38 = 暗示 4.62% 利率)
        fetchGoogleTrends("Bitcoin")              // 散户 FOMO 指标
    ]);

    const reasoning: string[] = [];
    let signal: MacroSignal = "neutral";
    let score = 0; // Negative = Easing (Bullish), Positive = Tightening (Bearish)

    // 1. 分析 联邦基金利率期货 (ZQ=F) 变化 - 最直接的降息预期
    // ZQ=F 价格上涨，意味着隐含利率 (100 - 价格) 下降，即市场计价更多降息
    const currentImpliedRate = 100 - zqData.value;
    const rateChangeBps = -zqData.change * 100; // 价格上涨(+)=利率下降(-)，转换为基点(bps)

    if (zqData.value === 95.38 && zqData.changePercent === 0) {
        reasoning.push("短期利率期货数据获取异常或持平，使用默认值估算");
    } else {
        if (rateChangeBps <= -5) {
            score -= 3; // 降息预期是最强烈的看涨信号，权重最高
            reasoning.push(`联邦基金利率期货暗示短期利率降至 ${currentImpliedRate.toFixed(2)}% (预期下调 ${Math.abs(rateChangeBps).toFixed(0)}个基点)，市场正迅速为美联储鸽派操作定价，强烈提振比特币宏观流动性预期。`);
        } else if (rateChangeBps < -1) {
            score -= 1;
            reasoning.push(`联邦基金利率期货暗示短期利率轻微下探至 ${currentImpliedRate.toFixed(2)}%，短端资金面边际宽松。`);
        } else if (rateChangeBps >= 5) {
            score += 3; // 加息/推迟降息预期是最强烈的看跌信号
            reasoning.push(`联邦基金利率期货暗示短期利率升至 ${currentImpliedRate.toFixed(2)}% (预期上调 ${rateChangeBps.toFixed(0)}个基点)，市场正收回降息预期，老钱抽水效应凸显，对比特币构成显著压制。`);
        } else if (rateChangeBps > 1) {
            score += 1;
            reasoning.push(`联邦基金利率期货暗示短期利率小幅升至 ${currentImpliedRate.toFixed(2)}%，短端资金面边际收紧。`);
        } else {
            reasoning.push(`联邦基金利率期货暗示短期利率暂稳于 ${currentImpliedRate.toFixed(2)}%，市场对近期货币政策预期保持稳定。`);
        }
    }

    // 2. 分析 10年期美债 (US10Y) 变化 - 无风险基准利率
    if (us10yData.value === 4.2 && us10yData.changePercent === 0) {
        reasoning.push("美债收益率数据获取异常或持平，使用默认值估算");
    } else {
        if (us10yData.changePercent < -1.5) {
            score -= 2;
            reasoning.push(`10年期美债收益率大幅回落至 ${us10yData.value.toFixed(2)}% (日内跌幅 ${Math.abs(us10yData.changePercent).toFixed(2)}%)，长端借贷成本实质性降低，无风险资产吸引力下降`);
        } else if (us10yData.changePercent < -0.5) {
            score -= 1;
            reasoning.push(`10年期美债收益率小幅下行至 ${us10yData.value.toFixed(2)}%，中长期资金环境边际改善`);
        } else if (us10yData.changePercent > 1.5) {
            score += 2;
            reasoning.push(`10年期美债收益率大幅飙升至 ${us10yData.value.toFixed(2)}% (日内涨幅 ${us10yData.changePercent.toFixed(2)}%)，长端收益率受通胀粘性影响走强，宏观抽水效应显著`);
        } else if (us10yData.changePercent > 0.5) {
            score += 1;
            reasoning.push(`10年期美债收益率上行至 ${us10yData.value.toFixed(2)}%，中长期借贷成本呈边际收紧态势`);
        } else {
            reasoning.push(`10年期美债收益率稳于 ${us10yData.value.toFixed(2)}%，长端宏观利率观望情绪浓厚。`);
        }
    }

    // 3. 分析 美元指数 (DXY) 变化
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

    // 4. 分析 谷歌搜索热度 (Retail Sentiment)
    if (trendsData.valid) {
        if (trendsData.trend === "spiking" && trendsData.recentAvg > 75) {
            score += 2; // 散户极度 FOMO，通常是局部见顶信号 (看跌)
            reasoning.push(`Google趋势显示散户搜索热情正处于高位并在近期激增 (热度 ${trendsData.recentAvg})，街头巷尾都在讨论比特币，这是经典的散户进场(FOMO)和潜在顶部流动性派发信号。`);
        } else if (trendsData.trend === "cooling" && trendsData.recentAvg < 30) {
            score -= 2; // 散户完全失去兴趣，无人问津时买入 (看涨)
            reasoning.push(`Google趋势显示散户搜索兴趣冰冷且持续下降 (热度 ${trendsData.recentAvg})，市场冷清无人问津，洗盘充分，符合经典的“在绝望中建仓”逆向积累契机。`);
        } else {
            reasoning.push(`Google趋势散户搜索热度处于中性平稳状态 (热度 ${trendsData.recentAvg})，情绪面暂未出现极端的群体性疯狂或绝望。`);
        }
    } else {
        reasoning.push("无法获取 Google 搜索热度数据，临时忽略该零售指标。");
    }

    // 综合打分推导 Signal 信号 (满分 ±7)
    if (score <= -3) {
        signal = "easing";
        reasoning.push("宏观总结：短端降息预期叠加长端/流动性走弱，全球美元流动性打开水龙头。资金正主动寻求高弹性抗通胀标的，比特币宏观上处于极其有利的顺风局。");
    } else if (score >= 3) {
        signal = "tightening";
        reasoning.push("宏观总结：短端利率预期抬升叠加长端走强。法币无风险收益吸筹严重，比特币宏观资金面处于极度逆风局，极易发生获利盘抽水或‘卖事实’抛压。");
    } else {
        signal = "neutral";
        reasoning.push("宏观总结：美联储预期管理博弈中，各项宏观指标互相牵制或变动较小，总体流动性处于中性区间带。比特币走势将更多让步于加密技术面内部博弈及 ETF 净流向。");
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
        impliedFedRate: {
            value: Number(currentImpliedRate.toFixed(3)),
            changeBps: Number(rateChangeBps.toFixed(1)),
        },
        retailSentiment: {
            trend: trendsData.trend,
            value: trendsData.recentAvg,
            timeline: trendsData.timeline || [],
        },
        reasoning,
        timestamp: new Date().toISOString(),
    };
}
