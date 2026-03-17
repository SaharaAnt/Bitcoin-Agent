import crypto from "crypto";
import { getBtcCurrentPrice, getBtcDailyPrices } from "@/lib/api/coingecko";

export type RiskReportParams = {
  volatilityWindowDays: number;
  drawdownLookbackDays: number;
  smaDays: number;
};

export type RiskReportSource = {
  name: "coingecko";
  fetchedAt: string;
  notes?: string;
};

export type RiskReportRiskLevel = "low" | "medium" | "high";

export type RiskReport = {
  asOf: string;
  asset: "BTC";
  vsCurrency: "USD";
  params: RiskReportParams;
  sources: RiskReportSource[];
  metrics: {
    price: number;
    drawdownFromPeakPct: number;
    peakPrice: number;
    peakWindowDays: number;
    volatilityAnnualizedPct: number;
    volatilityWindowDays: number;
    sma: number;
    smaDays: number;
    priceVsSmaPct: number;
    trend: "above" | "below" | "near";
  };
  regime: {
    trend: "up" | "down";
    volatility: "low" | "medium" | "high";
    overallRisk: RiskReportRiskLevel;
  };
  risks: Array<{
    id: "drawdown" | "volatility" | "trend";
    title: string;
    level: RiskReportRiskLevel;
    condition: string;
    rationale: string;
    evidence: Array<{ metric: string; value: number; unit: string }>;
  }>;
  scenarios: Array<{
    title: string;
    if: string;
    then: string;
  }>;
  summary: string;
  confidence: number; // 0..1
};

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;

  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(",")}}`;
}

export function hashRiskReport(report: RiskReport): string {
  return crypto.createHash("sha256").update(stableStringify(report)).digest("hex");
}

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function mean(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function stddev(values: number[]) {
  if (values.length <= 1) return 0;
  const m = mean(values);
  const variance = mean(values.map((v) => (v - m) ** 2));
  return Math.sqrt(variance);
}

function riskLevelFromThresholds(
  value: number,
  lowToMedium: number,
  mediumToHigh: number
): RiskReportRiskLevel {
  if (value >= mediumToHigh) return "high";
  if (value >= lowToMedium) return "medium";
  return "low";
}

export async function generateBtcRiskReport(
  input?: Partial<RiskReportParams>
): Promise<RiskReport> {
  const now = new Date();
  const params: RiskReportParams = {
    volatilityWindowDays: input?.volatilityWindowDays ?? 30,
    drawdownLookbackDays: input?.drawdownLookbackDays ?? 365,
    smaDays: input?.smaDays ?? 200,
  };

  const bufferDays = 12;
  const from = new Date(
    now.getTime() - (params.drawdownLookbackDays + bufferDays) * 24 * 60 * 60 * 1000
  );

  const [current, daily] = await Promise.all([
    getBtcCurrentPrice(),
    getBtcDailyPrices(from, now),
  ]);

  const price = current.price;
  const cutoff = now.getTime() - params.drawdownLookbackDays * 24 * 60 * 60 * 1000;
  const lookback = daily.filter((p) => p.timestamp >= cutoff);
  const peakPrice =
    lookback.length > 0 ? Math.max(...lookback.map((p) => p.price)) : price;
  const drawdownFromPeakPct =
    peakPrice > 0 ? ((peakPrice - price) / peakPrice) * 100 : 0;

  const volWindow = daily.slice(-(params.volatilityWindowDays + 1));
  const returns: number[] = [];
  for (let i = 1; i < volWindow.length; i++) {
    const p0 = volWindow[i - 1]?.price ?? 0;
    const p1 = volWindow[i]?.price ?? 0;
    if (p0 > 0 && p1 > 0) returns.push(Math.log(p1 / p0));
  }
  const volDaily = stddev(returns);
  const volatilityAnnualizedPct = volDaily * Math.sqrt(365) * 100;

  const smaWindow = daily.slice(-params.smaDays);
  const sma = mean(smaWindow.map((p) => p.price));
  const priceVsSmaPct = sma > 0 ? ((price - sma) / sma) * 100 : 0;
  const trend: RiskReport["metrics"]["trend"] =
    Math.abs(priceVsSmaPct) < 1 ? "near" : priceVsSmaPct >= 0 ? "above" : "below";

  const drawdownLevel = riskLevelFromThresholds(drawdownFromPeakPct, 10, 25);
  const volatilityLevel = riskLevelFromThresholds(volatilityAnnualizedPct, 50, 85);
  const trendRiskLevel: RiskReportRiskLevel =
    priceVsSmaPct <= -8 ? "high" : priceVsSmaPct <= -2 ? "medium" : "low";

  const overallRisk: RiskReportRiskLevel =
    [drawdownLevel, volatilityLevel, trendRiskLevel].includes("high")
      ? "high"
      : [drawdownLevel, volatilityLevel, trendRiskLevel].includes("medium")
        ? "medium"
        : "low";

  const regimeTrend = priceVsSmaPct >= 0 ? "up" : "down";
  const regimeVol =
    volatilityAnnualizedPct >= 85 ? "high" : volatilityAnnualizedPct >= 50 ? "medium" : "low";

  const dataLagHours =
    daily.length > 0 ? (now.getTime() - daily[daily.length - 1]!.timestamp) / 36e5 : 999;
  const dataCoverage = clamp01(daily.length / Math.max(30, params.drawdownLookbackDays * 0.7));
  const confidence = clamp01(
    0.2 +
      0.6 * dataCoverage +
      (dataLagHours <= 36 ? 0.2 : dataLagHours <= 72 ? 0.1 : 0)
  );

  const summary = `BTC 风险简报：回撤 ${drawdownFromPeakPct.toFixed(1)}%（近${params.drawdownLookbackDays}天峰值 $${peakPrice.toFixed(
    0
  )}），30D 年化波动率 ${volatilityAnnualizedPct.toFixed(0)}%，价格相对 ${params.smaDays}D 均线 ${priceVsSmaPct.toFixed(
    1
  )}%。总体风险：${overallRisk === "high" ? "高" : overallRisk === "medium" ? "中" : "低"}。`;

  return {
    asOf: now.toISOString(),
    asset: "BTC",
    vsCurrency: "USD",
    params,
    sources: [
      {
        name: "coingecko",
        fetchedAt: now.toISOString(),
        notes: "Price uses /simple/price; history uses /market_chart/range.",
      },
    ],
    metrics: {
      price,
      drawdownFromPeakPct,
      peakPrice,
      peakWindowDays: params.drawdownLookbackDays,
      volatilityAnnualizedPct,
      volatilityWindowDays: params.volatilityWindowDays,
      sma,
      smaDays: params.smaDays,
      priceVsSmaPct,
      trend,
    },
    regime: {
      trend: regimeTrend,
      volatility: regimeVol,
      overallRisk,
    },
    risks: [
      {
        id: "drawdown",
        title: "回撤风险",
        level: drawdownLevel,
        condition: `以近${params.drawdownLookbackDays}天峰值为基准评估回撤。`,
        rationale:
          drawdownLevel === "high"
            ? "回撤超过 25%，短期情绪与流动性风险更高。"
            : drawdownLevel === "medium"
              ? "回撤处于 10–25% 区间，波动放大时容易触发连锁反应。"
              : "回撤较小，短期压力相对可控。",
        evidence: [
          { metric: "drawdownFromPeakPct", value: drawdownFromPeakPct, unit: "%" },
          { metric: "peakPrice", value: peakPrice, unit: "USD" },
        ],
      },
      {
        id: "volatility",
        title: "波动风险",
        level: volatilityLevel,
        condition: `以近${params.volatilityWindowDays}天日收益计算年化波动率。`,
        rationale:
          volatilityLevel === "high"
            ? "年化波动率处于高位，仓位与杠杆更容易被波动击穿。"
            : volatilityLevel === "medium"
              ? "波动率偏高，建议以规则化计划执行，避免频繁追涨杀跌。"
              : "波动率相对温和，执行计划的噪声更小。",
        evidence: [
          {
            metric: "volatilityAnnualizedPct",
            value: volatilityAnnualizedPct,
            unit: "%",
          },
        ],
      },
      {
        id: "trend",
        title: "趋势风险（200D）",
        level: trendRiskLevel,
        condition: `用价格相对${params.smaDays}日均线的偏离衡量趋势强弱。`,
        rationale:
          trendRiskLevel === "high"
            ? "明显低于长期均线，市场通常处于偏弱趋势区间。"
            : trendRiskLevel === "medium"
              ? "略低于长期均线，趋势偏弱但仍可能反复拉扯。"
              : "趋势未显著转弱（或在均线附近），需要结合回撤与波动看强弱。",
        evidence: [
          { metric: "priceVsSmaPct", value: priceVsSmaPct, unit: "%" },
          { metric: "sma", value: sma, unit: "USD" },
        ],
      },
    ],
    scenarios: [
      {
        title: "趋势延续",
        if: "价格持续低于长期均线且波动率偏高（priceVsSmaPct < 0 且 volAnn >= 50%）",
        then: "短期下行与剧烈反抽会更频繁；更适合用固定规则分批执行，避免主观追涨杀跌。",
      },
      {
        title: "均线收复",
        if: "价格站上长期均线且回撤收敛（priceVsSmaPct >= 0 且 drawdown < 15%）",
        then: "趋势修复信号增强；但仍需关注波动率是否同步下降，以减少假突破风险。",
      },
    ],
    summary,
    confidence,
  };
}
