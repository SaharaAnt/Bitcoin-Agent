import { tool } from "ai";
import { z } from "zod/v4";
import { runBacktest, runSmartBacktest, runComparison } from "../engine/dca-engine";
import { getBtcCurrentPrice } from "../api/coingecko";
import { getFearGreedCurrent } from "../api/fear-greed";
import { analyzeMarketConditions } from "../engine/strategy-advisor";
import { calculateAhr999 } from "../engine/ahr999";
import { getNetworkCongestionStatus } from "../api/mempool";
import { getMockedLiquidations } from "../api/liquidations";
import type { Frequency } from "../engine/types";
import etfData from "../data/farside-data.json";
import { getMvrvData } from "../api/mvrv";

export const agentTools = {
    runDCABacktest: tool({
        description:
            "执行标准 DCA 回测。输入起止日期、定投频率和每次金额，返回回测结果。",
        inputSchema: z.object({
            startDate: z.string().describe("开始日期，格式 YYYY-MM-DD"),
            endDate: z.string().describe("结束日期，格式 YYYY-MM-DD"),
            frequency: z
                .enum(["daily", "weekly", "biweekly", "monthly"])
                .describe("定投频率"),
            amount: z.number().describe("每次定投金额（美元）"),
        }),
        execute: async ({ startDate, endDate, frequency, amount }) => {
            const result = await runBacktest({
                startDate,
                endDate,
                frequency: frequency as Frequency,
                amount,
                smartDCA: false,
                fearThreshold: 25,
                greedThreshold: 75,
                fearMultiplier: 2.0,
                greedMultiplier: 0.5,
            });

            return {
                totalInvested: `$${result.totalInvested.toLocaleString()}`,
                totalBTC: `${result.totalBTC.toFixed(8)} BTC`,
                finalValue: `$${result.finalValue.toLocaleString()}`,
                roi: `${result.roi.toFixed(2)}%`,
                annualizedReturn: `${result.annualizedReturn.toFixed(2)}%`,
                maxDrawdown: `${result.maxDrawdown.toFixed(2)}%`,
                averageCost: `$${result.averageCost.toLocaleString()}`,
                totalBuys: result.buys.length,
            };
        },
    }),

    runSmartDCABacktest: tool({
        description:
            "执行智能 DCA 回测。基于恐惧贪婪指数动态调整定投金额。恐惧时加仓，贪婪时减仓。",
        inputSchema: z.object({
            startDate: z.string().describe("开始日期，格式 YYYY-MM-DD"),
            endDate: z.string().describe("结束日期，格式 YYYY-MM-DD"),
            frequency: z
                .enum(["daily", "weekly", "biweekly", "monthly"])
                .describe("定投频率"),
            amount: z.number().describe("基础定投金额（美元）"),
            fearThreshold: z.number().optional().describe("恐惧阈值，默认25"),
            greedThreshold: z.number().optional().describe("贪婪阈值，默认75"),
            fearMultiplier: z.number().optional().describe("恐惧加仓倍数，默认2x"),
            greedMultiplier: z
                .number()
                .optional()
                .describe("贪婪减仓倍数，默认0.5x"),
        }),
        execute: async ({
            startDate,
            endDate,
            frequency,
            amount,
            fearThreshold = 25,
            greedThreshold = 75,
            fearMultiplier = 2.0,
            greedMultiplier = 0.5,
        }) => {
            const result = await runSmartBacktest({
                startDate,
                endDate,
                frequency: frequency as Frequency,
                amount,
                smartDCA: true,
                fearThreshold,
                greedThreshold,
                fearMultiplier,
                greedMultiplier,
            });

            return {
                totalInvested: `$${result.totalInvested.toLocaleString()}`,
                totalBTC: `${result.totalBTC.toFixed(8)} BTC`,
                finalValue: `$${result.finalValue.toLocaleString()}`,
                roi: `${result.roi.toFixed(2)}%`,
                annualizedReturn: `${result.annualizedReturn.toFixed(2)}%`,
                maxDrawdown: `${result.maxDrawdown.toFixed(2)}%`,
                averageCost: `$${result.averageCost.toLocaleString()}`,
                totalBuys: result.buys.length,
            };
        },
    }),

    compareStrategies: tool({
        description:
            "对比三种策略：标准 DCA、智能 DCA、一次性买入。同一时间段和总金额。",
        inputSchema: z.object({
            startDate: z.string().describe("开始日期，格式 YYYY-MM-DD"),
            endDate: z.string().describe("结束日期，格式 YYYY-MM-DD"),
            frequency: z
                .enum(["daily", "weekly", "biweekly", "monthly"])
                .describe("定投频率"),
            amount: z.number().describe("每次定投金额（美元）"),
        }),
        execute: async ({ startDate, endDate, frequency, amount }) => {
            const result = await runComparison({
                startDate,
                endDate,
                frequency: frequency as Frequency,
                amount,
                smartDCA: false,
                fearThreshold: 25,
                greedThreshold: 75,
                fearMultiplier: 2.0,
                greedMultiplier: 0.5,
            });

            return {
                standardDCA: {
                    roi: `${result.standard.roi.toFixed(2)}%`,
                    finalValue: `$${result.standard.finalValue.toLocaleString()}`,
                    totalBTC: `${result.standard.totalBTC.toFixed(8)} BTC`,
                },
                smartDCA: {
                    roi: `${result.smart.roi.toFixed(2)}%`,
                    finalValue: `$${result.smart.finalValue.toLocaleString()}`,
                    totalBTC: `${result.smart.totalBTC.toFixed(8)} BTC`,
                },
                lumpSum: {
                    roi: `${result.lumpSum.roi.toFixed(2)}%`,
                    finalValue: `$${result.lumpSum.finalValue.toLocaleString()}`,
                    totalBTC: `${result.lumpSum.totalBTC.toFixed(8)} BTC`,
                },
            };
        },
    }),

    getBtcPrice: tool({
        description: "获取当前 BTC 价格、24小时变化和市值",
        inputSchema: z.object({}),
        execute: async () => {
            const data = await getBtcCurrentPrice();
            return {
                price: `$${data.price.toLocaleString()}`,
                change24h: `${data.change24h.toFixed(2)}%`,
                marketCap: `$${(data.marketCap / 1e9).toFixed(2)}B`,
            };
        },
    }),

    getFearGreedIndex: tool({
        description: "获取当前 Bitcoin 市场恐惧贪婪指数（0-100）",
        inputSchema: z.object({}),
        execute: async () => {
            const data = await getFearGreedCurrent();
            return {
                value: data.value,
                label: data.label,
                date: data.date,
                interpretation:
                    data.value <= 25
                        ? "极度恐惧 - 通常是好的买入时机"
                        : data.value <= 45
                            ? "恐惧 - 可以考虑适当加仓"
                            : data.value <= 55
                                ? "中性 - 正常定投即可"
                                : data.value <= 75
                                    ? "贪婪 - 可以适当减少定投量"
                                    : "极度贪婪 - 建议减少定投，保持现金",
            };
        },
    }),

    analyzeMarket: tool({
        description:
            "分析当前市场状况（BTC价格、恐惧贪婪指数、7天趋势），给出智能DCA策略参数调整建议",
        inputSchema: z.object({}),
        execute: async () => {
            const analysis = await analyzeMarketConditions();
            return {
                signal: analysis.signalLabel,
                confidence: `${analysis.confidence}%`,
                btcPrice: `$${analysis.btc.price.toLocaleString()}`,
                btcChange24h: `${analysis.btc.change24h.toFixed(2)}%`,
                fgiValue: analysis.fgi.value,
                fgiLabel: analysis.fgi.label,
                fgiTrend: analysis.fgi.trend === "falling"
                    ? "下降趋势"
                    : analysis.fgi.trend === "rising"
                        ? "上升趋势"
                        : "平稳",
                fgi7dAvg: analysis.fgi.avg7d,
                suggestedFrequency: analysis.suggestion.frequency,
                suggestedFearThreshold: analysis.suggestion.fearThreshold,
                suggestedGreedThreshold: analysis.suggestion.greedThreshold,
                suggestedFearMultiplier: `${analysis.suggestion.fearMultiplier}x`,
                suggestedGreedMultiplier: `${analysis.suggestion.greedMultiplier}x`,
                reasoning: analysis.suggestion.reasoning,
            };
        },
    }),

    getAhr999: tool({
        description:
            "获取当前 Bitcoin Ahr999 指标值。Ahr999 结合 200 日均价和指数增长模型评估 BTC 估值。<0.45 抄底区间，0.45~1.2 定投区间，>1.2 等待区间。",
        inputSchema: z.object({}),
        execute: async () => {
            const data = await calculateAhr999();
            return {
                ahr999: data.value,
                zone: data.zoneLabel,
                currentPrice: `$${data.price.toLocaleString()}`,
                ma200: `$${data.ma200.toLocaleString()}`,
                expectedPrice: `$${data.expectedPrice.toLocaleString()}`,
                coinAgeDays: data.coinAgeDays,
                interpretation:
                    data.zone === "bottom"
                        ? "Ahr999 低于 0.45，处于抄底区间，历史上是极佳的长期买入机会"
                        : data.zone === "dca"
                            ? "Ahr999 在 0.45~1.2 之间，处于定投区间，适合正常坚持定投"
                            : "Ahr999 高于 1.2，处于等待区间，建议减少定投或等待回调",
            };
        },
    }),

    getOnchainData: tool({
        description:
            "获取链上实时数据：比特币网络拥堵状态（mempool手续费）和全网期货爆仓情况。用于判断市场恐慌/狂热程度及链上流动性。",
        inputSchema: z.object({}),
        execute: async () => {
            const [btc, fgi] = await Promise.all([
                getBtcCurrentPrice(),
                getFearGreedCurrent(),
            ]);
            const [mempool, liquidations] = await Promise.all([
                getNetworkCongestionStatus(),
                getMockedLiquidations(fgi.value, btc.change24h),
            ]);
            return {
                network: {
                    isCongested: mempool.isCongested,
                    fastestFee: `${mempool.fees.fastestFee} sat/vB`,
                    economyFee: `${mempool.fees.economyFee} sat/vB`,
                    status: mempool.isCongested ? "拥堵" : "畅通",
                    note: mempool.reasoning,
                },
                liquidations: {
                    total: `${liquidations.totalLiquidationsUSD} 亿美元`,
                    longs: `${liquidations.longLiquidationsUSD} 亿美元`,
                    shorts: `${liquidations.shortLiquidationsUSD} 亿美元`,
                    dominantSide: liquidations.dominantSide,
                    analysis: liquidations.reasoning,
                },
            };
        },
    }),

    getEtfFlows: tool({
        description:
            "获取比特币现货 ETF 的最新资金流向数据(单位: 百万美元)。用于判断华尔街资金的买卖情绪。正数表示净流入，负数表示净流出。",
        inputSchema: z.object({}),
        execute: async () => {
            try {
                const data: { date: string; total: number }[] = etfData;

                const validData = data.filter((d) => !isNaN(d.total));
                if (validData.length === 0) throw new Error("No data");

                const latest5Days = validData.slice(-5).map((d) => ({
                    date: d.date,
                    netFlowM: d.total / 1_000_000,
                }));

                const latestDay = latest5Days[latest5Days.length - 1];
                let totalNetInflow = 0;
                validData.forEach((d) => totalNetInflow += d.total);

                return {
                    latestDay: {
                        date: latestDay.date,
                        netFlow: `${latestDay.netFlowM > 0 ? "+" : ""}${latestDay.netFlowM.toFixed(1)} 百万美元`,
                        sentiment: latestDay.netFlowM > 0 ? "资金流入 (看涨)" : "资金流出 (看跌)"
                    },
                    recent5DaysTrend: latest5Days.map(d => `${d.date}: ${d.netFlowM > 0 ? "+" : ""}${d.netFlowM.toFixed(1)}M`).join(" | "),
                    totalHistoricalInflow: `$${(totalNetInflow / 1_000_000 / 1000).toFixed(2)} Billion`,
                    interpretation: latestDay.netFlowM > 0
                        ? "华尔街资金正在买入，为市场提供强力支撑。"
                        : "华尔街资金正在流出，短期可能存在抛压风险。"
                };
            } catch (err) {
                console.error("Agent error reading ETF data:", err);
                return { error: "无法获取最新的 ETF 资金流向数据。" };
            }
        },
    }),

    getMvrvData: tool({
        description:
            "获取比特币 MVRV Z-Score 链上指标。MVRV Z-Score 是判断比特币牛熊周期位置最重要的指标之一，可显示当前估值相对历史成本基础的偏离程度。",
        inputSchema: z.object({}),
        execute: async () => {
            try {
                const data = await getMvrvData();
                return {
                    zScore: data.zScore,
                    mvrv: `${data.mvrv.toFixed(2)}x`,
                    zone: data.zoneLabel,
                    marketCap: `$${(data.marketCap / 1e9).toFixed(0)}B`,
                    realizedCap: `$${(data.realizedCap / 1e9).toFixed(0)}B`,
                    interpretation: data.description,
                    signal: data.zone === "top" || data.zone === "high"
                        ? "减少定投，注意高估风险"
                        : data.zone === "bottom" || data.zone === "low"
                            ? "适合加仓，历史上高胜率区间"
                            : "正常定投节奏",
                };
            } catch (err) {
                console.error("Agent error fetching MVRV data:", err);
                return { error: "无法获取 MVRV Z-Score 数据。" };
            }
        },
    }),
};
