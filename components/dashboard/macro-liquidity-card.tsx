"use client";

import { useEffect, useState } from "react";
import { Activity, Droplets, TrendingDown, TrendingUp, AlertTriangle, Globe } from "lucide-react";
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
        <div className="card fade-in">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: "rgba(59, 130, 246, 0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                    }}>
                        <Globe size={18} color="#3b82f6" />
                    </div>
                    <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>全球宏观流动性</h2>
                </div>
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 12px",
                    borderRadius: 10,
                    background: `color-mix(in srgb, ${statusColor} 12%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${statusColor} 25%, transparent)`,
                }}>
                    <StatusIcon size={14} color={statusColor} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: statusColor, letterSpacing: "0.02em" }}>
                        {signalLabel.split(" ")[0]}
                    </span>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                {/* 隐含降息预期 */}
                <div style={{ background: "rgba(255,255,255,0.02)", padding: 14, borderRadius: 12, border: "1px solid rgba(255,255,255,0.03)" }}>
                    <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
                        隐含基准利率 <span style={{ fontSize: 9, opacity: 0.6 }}>(ZQ=F)</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                        <span style={{ fontSize: 22, fontWeight: 800, fontFamily: "var(--font-mono)" }}>{impliedFedRate.value.toFixed(2)}%</span>
                        <span style={{
                            fontSize: 11,
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            color: impliedFedRate.changeBps < 0 ? "var(--green)" : impliedFedRate.changeBps > 0 ? "var(--red)" : "var(--text-muted)"
                        }}>
                            {impliedFedRate.changeBps < 0 ? <TrendingDown size={12} /> : impliedFedRate.changeBps > 0 ? <TrendingUp size={12} /> : null}
                            {Math.abs(impliedFedRate.changeBps)} bps
                        </span>
                    </div>
                </div>

                {/* 其他宏观指标缩略 */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ border: "1px solid rgba(255,255,255,0.03)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.02)", padding: "10px 14px", borderRadius: 10 }}>
                        <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>10Y 美债</span>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "var(--font-mono)" }}>{us10y.value}%</span>
                            <span style={{ fontSize: 10, fontWeight: 600, color: us10y.changePercent < 0 ? "var(--green)" : "var(--red)" }}>
                                {us10y.changePercent > 0 ? "+" : ""}{us10y.changePercent}%
                            </span>
                        </div>
                    </div>
                    <div style={{ border: "1px solid rgba(255,255,255,0.03)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.02)", padding: "10px 14px", borderRadius: 10 }}>
                        <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>美元指数</span>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "var(--font-mono)" }}>{dxy.value.toFixed(1)}</span>
                            <span style={{ fontSize: 10, fontWeight: 600, color: dxy.changePercent < 0 ? "var(--green)" : "var(--red)" }}>
                                {dxy.changePercent > 0 ? "+" : ""}{dxy.changePercent}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{
                background: "rgba(0,0,0,0.2)",
                padding: 14,
                borderRadius: 12,
                borderLeft: `4px solid ${statusColor}`,
                boxShadow: "inset 0 0 20px rgba(0,0,0,0.1)"
            }}>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
                    <span style={{ fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <Activity size={14} color={statusColor} />
                        斯多葛引擎推演
                    </span>
                    {macro.reasoning[macro.reasoning.length - 1].replace("宏观总结：", "")}
                </p>
            </div>
        </div>
    );
}
