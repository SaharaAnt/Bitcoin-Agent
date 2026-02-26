"use client";

import { useEffect, useState } from "react";
import { Activity, Droplets, TrendingDown, TrendingUp, AlertTriangle } from "lucide-react";
import { MacroAnalysis } from "@/lib/engine/macro-advisor";

export default function MacroLiquidityCard() {
    const [macro, setMacro] = useState<MacroAnalysis | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchMacro() {
            try {
                const res = await fetch("/api/macro");
                if (res.ok) {
                    const data = await res.json();
                    setMacro(data);
                }
            } catch (err) {
                console.error("Failed to fetch macro:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchMacro();
    }, []);

    if (loading) {
        return (
            <div className="card-crypto" style={{ animation: "pulse 2s infinite", minHeight: 280 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                    <Activity size={18} color="var(--primary-color)" />
                    <h2 style={{ fontSize: 16, fontWeight: 600 }}>宏观流动性雷达</h2>
                </div>
                <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ color: "var(--text-muted)", fontSize: 13 }}>探测全球资金面...</span>
                </div>
            </div>
        );
    }

    if (!macro) {
        return null;
    }

    const { signal, signalLabel, dxy, us10y, impliedFedRate } = macro;

    // 根据 Signal 决定主题颜色和图标
    const isEasing = signal === "easing";
    const isTightening = signal === "tightening";
    const statusColor = isEasing ? "var(--success-color)" : isTightening ? "var(--danger-color)" : "var(--warning-color)";
    const StatusIcon = isEasing ? Droplets : isTightening ? AlertTriangle : Activity;

    return (
        <div className="card-crypto fade-in">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Activity size={18} color="var(--primary-color)" />
                    <h2 style={{ fontSize: 16, fontWeight: 600 }}>宏观流动性</h2>
                </div>
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 10px",
                    borderRadius: 20,
                    background: `color-mix(in srgb, ${statusColor} 15%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${statusColor} 30%, transparent)`,
                }}>
                    <StatusIcon size={14} color={statusColor} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: statusColor }}>
                        {signalLabel.split(" ")[0]}
                    </span>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                {/* 隐含降息预期 */}
                <div style={{ background: "rgba(255,255,255,0.03)", padding: 12, borderRadius: 12 }}>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>隐含基准利率 (ZQ=F)</div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                        <span style={{ fontSize: 24, fontWeight: 700 }}>{impliedFedRate.value.toFixed(2)}%</span>
                        <span style={{
                            fontSize: 12,
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            color: impliedFedRate.changeBps < 0 ? "var(--success-color)" : impliedFedRate.changeBps > 0 ? "var(--danger-color)" : "var(--text-muted)"
                        }}>
                            {impliedFedRate.changeBps < 0 ? <TrendingDown size={14} /> : impliedFedRate.changeBps > 0 ? <TrendingUp size={14} /> : null}
                            {impliedFedRate.changeBps > 0 ? "+" : ""}{impliedFedRate.changeBps} bps
                        </span>
                    </div>
                </div>

                {/* 美债 与 美元 */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.02)", padding: "8px 12px", borderRadius: 8 }}>
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>US10Y 美债</span>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            <span style={{ fontSize: 13, fontWeight: 600 }}>{us10y.value}%</span>
                            <span style={{ fontSize: 11, color: us10y.changePercent < 0 ? "var(--success-color)" : "var(--danger-color)" }}>
                                {us10y.changePercent > 0 ? "+" : ""}{us10y.changePercent}%
                            </span>
                        </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.02)", padding: "8px 12px", borderRadius: 8 }}>
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>DXY 美元</span>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            <span style={{ fontSize: 13, fontWeight: 600 }}>{dxy.value.toFixed(1)}</span>
                            <span style={{ fontSize: 11, color: dxy.changePercent < 0 ? "var(--success-color)" : "var(--danger-color)" }}>
                                {dxy.changePercent > 0 ? "+" : ""}{dxy.changePercent}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ background: "rgba(0,0,0,0.3)", padding: 12, borderRadius: 8, borderLeft: `3px solid ${statusColor}` }}>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>
                    <span style={{ fontWeight: 600, color: "var(--text-primary)", display: "block", marginBottom: 4 }}>斯多葛引擎推演：</span>
                    {macro.reasoning[macro.reasoning.length - 1].replace("宏观总结：", "")}
                </p>
            </div>
        </div>
    );
}
