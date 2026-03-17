"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, ShieldAlert, ShieldCheck, Shield } from "lucide-react";
import IndicatorCard from "@/components/dashboard/indicator-card";

type RiskLevel = "low" | "medium" | "high";

type RiskReport = {
    asOf: string;
    summary: string;
    confidence: number;
    metrics: {
        drawdownFromPeakPct: number;
        peakWindowDays: number;
        volatilityAnnualizedPct: number;
        volatilityWindowDays: number;
        smaDays: number;
        priceVsSmaPct: number;
        trend: "above" | "below" | "near";
    };
    regime: {
        overallRisk: RiskLevel;
        trend: "up" | "down";
        volatility: "low" | "medium" | "high";
    };
    risks: Array<{
        id: string;
        title: string;
        level: RiskLevel;
        condition: string;
        rationale: string;
        evidence: Array<{ metric: string; value: number; unit: string }>;
    }>;
    scenarios: Array<{ title: string; if: string; then: string }>;
};

type ApiSnapshot = {
    id: string;
    createdAt: string;
    asOf: string;
    confidence: number;
    report: RiskReport;
};

function levelLabel(level: RiskLevel) {
    if (level === "high") return "高";
    if (level === "medium") return "中";
    return "低";
}

function levelColor(level: RiskLevel) {
    if (level === "high") return "#ef4444";
    if (level === "medium") return "#eab308";
    return "#22c55e";
}

export default function RiskBriefCard() {
    const [snapshot, setSnapshot] = useState<ApiSnapshot | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSnapshot = useCallback(async (force = false) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(force ? "/api/risk/report?fresh=1" : "/api/risk/report");
            if (!res.ok) throw new Error(`${res.status}`);
            const json = await res.json();
            setSnapshot(json.snapshot ?? null);
        } catch (err) {
            console.error("[risk-brief]", err);
            setError("获取风险简报失败");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSnapshot(false);
    }, [fetchSnapshot]);

    const report = snapshot?.report ?? null;

    const overallLevel = report?.regime?.overallRisk ?? "medium";
    const overallValueColor = levelColor(overallLevel);

    const badge = useMemo(() => {
        const Icon = overallLevel === "high" ? ShieldAlert : overallLevel === "low" ? ShieldCheck : Shield;
        return (
            <div
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 10px",
                    borderRadius: 999,
                    background: `color-mix(in srgb, ${overallValueColor} 14%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${overallValueColor} 28%, transparent)`,
                    color: overallValueColor,
                    fontSize: 11,
                    fontWeight: 800,
                }}
            >
                <Icon size={13} />
                风险{levelLabel(overallLevel)}
            </div>
        );
    }, [overallLevel, overallValueColor]);

    const rightAction = (
        <button
            onClick={() => fetchSnapshot(true)}
            disabled={loading}
            style={{
                background: "none",
                border: "1px solid var(--border-color)",
                borderRadius: 8,
                padding: "4px 8px",
                cursor: loading ? "wait" : "pointer",
                color: "var(--text-secondary)",
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
            }}
        >
            <RefreshCw
                size={12}
                style={{ animation: loading ? "spin 1s linear infinite" : "none" }}
            />
            刷新
        </button>
    );

    if (loading && !snapshot) {
        return (
            <IndicatorCard
                title="市场 / 风险简报"
                subtitle="加载中…"
                value="—"
                badge={badge}
                rightAction={rightAction}
                explanation="正在计算回撤 / 波动率 / 200D 趋势…"
            />
        );
    }

    if (!snapshot || !report || error) {
        return (
            <IndicatorCard
                title="市场 / 风险简报"
                subtitle={error ?? "暂无数据"}
                value="—"
                badge={badge}
                rightAction={rightAction}
                explanation="风险简报需要联网获取数据（CoinGecko）。请稍后重试。"
            />
        );
    }

    const details = (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                asOf: {new Date(report.asOf).toLocaleString()} · 置信度{" "}
                {(report.confidence * 100).toFixed(0)}%
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {report.risks.map((r) => (
                    <div
                        key={r.id}
                        style={{
                            background: "rgba(255,255,255,0.03)",
                            borderRadius: 10,
                            padding: "10px 12px",
                            border: `1px solid color-mix(in srgb, ${levelColor(r.level)} 22%, transparent)`,
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                            <div style={{ fontSize: 12, fontWeight: 800 }}>{r.title}</div>
                            <div
                                style={{
                                    fontSize: 10,
                                    fontWeight: 900,
                                    color: levelColor(r.level),
                                }}
                            >
                                {levelLabel(r.level)}
                            </div>
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 6, lineHeight: 1.55 }}>
                            {r.rationale}
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 800 }}>情景提示</div>
                {report.scenarios.map((s, idx) => (
                    <div
                        key={idx}
                        style={{
                            background: "rgba(0,0,0,0.2)",
                            borderRadius: 10,
                            padding: "10px 12px",
                            border: "1px solid rgba(255,255,255,0.04)",
                        }}
                    >
                        <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 4 }}>
                            {s.title}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>
                            if: {s.if}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                            {s.then}
                        </div>
                    </div>
                ))}
            </div>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );

    const subtitle = `回撤 / 波动率 / ${report.metrics.smaDays}D 趋势`;

    return (
        <IndicatorCard
            title="市场 / 风险简报"
            subtitle={subtitle}
            value={`风险${levelLabel(report.regime.overallRisk)}`}
            valueColor={overallValueColor}
            badge={badge}
            rightAction={rightAction}
            explanation={report.summary}
            footerItems={[
                {
                    label: `回撤（近${report.metrics.peakWindowDays}天）`,
                    value: `${report.metrics.drawdownFromPeakPct.toFixed(1)}%`,
                },
                {
                    label: `波动率（${report.metrics.volatilityWindowDays}D 年化）`,
                    value: `${report.metrics.volatilityAnnualizedPct.toFixed(0)}%`,
                },
                {
                    label: `${report.metrics.smaDays}D 趋势`,
                    value: `${report.metrics.priceVsSmaPct >= 0 ? "+" : ""}${report.metrics.priceVsSmaPct.toFixed(1)}%`,
                },
                {
                    label: "趋势方向",
                    value: report.metrics.trend === "above" ? "均线上方" : report.metrics.trend === "below" ? "均线下方" : "均线附近",
                },
            ]}
            details={details}
        />
    );
}

