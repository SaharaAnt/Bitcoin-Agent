"use client";

import { useEffect, useState } from "react";
import { Activity, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { MvrvData } from "@/lib/api/mvrv";

export default function MvrvCard() {
    const [data, setData] = useState<MvrvData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch("/api/market/mvrv");
                if (!res.ok) throw new Error("Failed");
                const json = await res.json();
                setData(json);
            } catch {
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="card" style={{ minHeight: 180, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ color: "var(--text-muted)", fontSize: 13 }}>加载 MVRV Z-Score...</div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="card" style={{ minHeight: 180 }}>
                <div style={{ color: "var(--red)", fontSize: 13 }}>无法获取 MVRV 数据</div>
            </div>
        );
    }

    const isTop = data.zone === "top";
    const isHigh = data.zone === "high";
    const isBottom = data.zone === "bottom";
    const isLow = data.zone === "low";

    const ZIcon = isTop || isHigh ? TrendingDown : isBottom || isLow ? TrendingUp : Minus;

    function formatCap(val: number): string {
        if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
        if (val >= 1e9) return `$${(val / 1e9).toFixed(0)}B`;
        return `$${val.toLocaleString()}`;
    }

    // Clamp z-score for gauge display
    const clampedZ = Math.max(-3, Math.min(9, data.zScore));
    // Map -3..9 range to 0..100%
    const gaugePercent = ((clampedZ + 3) / 12) * 100;

    // Gauge gradient zones
    const gaugeStyle: React.CSSProperties = {
        position: "relative",
        height: 10,
        borderRadius: 5,
        background: "linear-gradient(to right, #10b981 0%, #22c55e 20%, #f59e0b 40%, #f97316 65%, #ef4444 100%)",
        marginBottom: 16,
    };

    return (
        <div className="card">
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ background: `${data.zoneColor}22`, padding: 6, borderRadius: 8 }}>
                    <Activity size={18} color={data.zoneColor} />
                </div>
                <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>MVRV Z-Score</h3>
                    <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "2px 0 0 0" }}>
                        市场价值 / 实现价值 · 链上周期指标
                    </p>
                </div>
            </div>

            {/* Main score display */}
            <div style={{ display: "flex", alignItems: "flex-end", gap: 16, marginBottom: 20 }}>
                <div>
                    <div style={{ fontSize: 42, fontWeight: 800, lineHeight: 1, color: data.zoneColor }}>
                        {data.zScore > 0 ? "+" : ""}{data.zScore.toFixed(2)}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>Z-Score</div>
                </div>
                <div style={{ marginBottom: 6 }}>
                    <div
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            background: `${data.zoneColor}22`,
                            color: data.zoneColor,
                            padding: "6px 12px",
                            borderRadius: 20,
                            fontWeight: 700,
                            fontSize: 13,
                        }}
                    >
                        <ZIcon size={14} />
                        {data.zoneLabel}
                    </div>
                </div>
            </div>

            {/* Gauge bar */}
            <div style={{ marginBottom: 8 }}>
                <div style={gaugeStyle}>
                    {/* Indicator needle */}
                    <div
                        style={{
                            position: "absolute",
                            top: -4,
                            left: `${gaugePercent}%`,
                            transform: "translateX(-50%)",
                            width: 3,
                            height: 18,
                            background: "white",
                            borderRadius: 2,
                            boxShadow: "0 0 6px rgba(255,255,255,0.8)",
                        }}
                    />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-muted)" }}>
                    <span>极度低估 (-3)</span>
                    <span>合理 (0)</span>
                    <span>牛顶 (+9)</span>
                </div>
            </div>

            {/* Sub-metrics */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
                <div style={{ background: "var(--bg-secondary)", borderRadius: 8, padding: "10px 12px" }}>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4 }}>MVRV 比率</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: data.zoneColor }}>
                        {data.mvrv.toFixed(2)}x
                    </div>
                </div>
                <div style={{ background: "var(--bg-secondary)", borderRadius: 8, padding: "10px 12px" }}>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4 }}>市值</div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{formatCap(data.marketCap)}</div>
                </div>
                <div style={{ background: "var(--bg-secondary)", borderRadius: 8, padding: "10px 12px" }}>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4 }}>实现价值</div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{formatCap(data.realizedCap)}</div>
                </div>
            </div>

            {/* Description */}
            <div style={{
                padding: "10px 12px",
                background: `${data.zoneColor}11`,
                borderLeft: `3px solid ${data.zoneColor}`,
                borderRadius: "0 8px 8px 0",
                fontSize: 12,
                color: "var(--text-secondary)",
                lineHeight: 1.6,
            }}>
                {data.description}
            </div>
        </div>
    );
}
