"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Activity,
    RefreshCw,
    AlertTriangle,
    TrendingDown,
    Target,
    Pause,
} from "lucide-react";

interface Ahr999Data {
    value: number;
    zone: "bottom" | "dca" | "wait";
    zoneLabel: string;
    price: number;
    ma200: number;
    expectedPrice: number;
    coinAgeDays: number;
    timestamp: string;
}

const ZONE_CONFIG = {
    bottom: {
        color: "#22c55e",
        bg: "rgba(34, 197, 94, 0.12)",
        border: "rgba(34, 197, 94, 0.25)",
        icon: TrendingDown,
        advice: "当前处于抄底区间，历史上是极佳的买入时机",
    },
    dca: {
        color: "#eab308",
        bg: "rgba(234, 179, 8, 0.10)",
        border: "rgba(234, 179, 8, 0.25)",
        icon: Target,
        advice: "当前处于定投区间，坚持定期定额投入",
    },
    wait: {
        color: "#ef4444",
        bg: "rgba(239, 68, 68, 0.12)",
        border: "rgba(239, 68, 68, 0.25)",
        icon: Pause,
        advice: "当前处于等待区间，建议减少定投或观望",
    },
};

export default function Ahr999Card() {
    const [data, setData] = useState<Ahr999Data | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/ahr999");
            if (!res.ok) throw new Error(`${res.status}`);
            setData(await res.json());
        } catch (err) {
            setError("获取 Ahr999 失败");
            console.error("[ahr999-card]", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const zone = data ? ZONE_CONFIG[data.zone] : ZONE_CONFIG.dca;
    const ZoneIcon = zone.icon;

    // Calculate gauge position (0-100 scale, clamped)
    const gaugePercent = data
        ? Math.min(100, Math.max(0, (data.value / 2.0) * 100))
        : 50;

    return (
        <div
            className="glass-card"
            style={{
                padding: 20,
                borderRadius: 16,
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-color)",
                position: "relative",
                overflow: "hidden",
            }}
        >
            {/* Top accent */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background: `linear-gradient(90deg, ${zone.color}, transparent)`,
                }}
            />

            {/* Header */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 16,
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Activity size={18} color={zone.color} />
                    <h3
                        style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: "var(--text-primary)",
                        }}
                    >
                        Ahr999 指标
                    </h3>
                </div>
                <button
                    onClick={fetchData}
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
                        gap: 4,
                        fontSize: 12,
                    }}
                >
                    <RefreshCw
                        size={12}
                        style={{
                            animation: loading ? "spin 1s linear infinite" : "none",
                        }}
                    />
                    刷新
                </button>
            </div>

            {/* Loading */}
            {loading && !data && (
                <div
                    style={{
                        textAlign: "center",
                        padding: "32px 0",
                        color: "var(--text-muted)",
                        fontSize: 13,
                    }}
                >
                    <RefreshCw
                        size={20}
                        style={{
                            animation: "spin 1s linear infinite",
                            margin: "0 auto 8px",
                            display: "block",
                        }}
                    />
                    计算 Ahr999...
                </div>
            )}

            {/* Error */}
            {error && (
                <div
                    style={{
                        textAlign: "center",
                        padding: "24px 0",
                        color: "#ef4444",
                        fontSize: 13,
                    }}
                >
                    <AlertTriangle
                        size={20}
                        style={{ margin: "0 auto 8px", display: "block" }}
                    />
                    {error}
                </div>
            )}

            {/* Content */}
            {data && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {/* Value + Zone */}
                    <div
                        style={{
                            background: zone.bg,
                            border: `1px solid ${zone.border}`,
                            borderRadius: 12,
                            padding: "14px 16px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <div>
                            <div
                                style={{
                                    fontSize: 28,
                                    fontWeight: 800,
                                    color: zone.color,
                                    fontVariantNumeric: "tabular-nums",
                                }}
                            >
                                {data.value.toFixed(3)}
                            </div>
                            <div
                                style={{
                                    fontSize: 12,
                                    color: zone.color,
                                    fontWeight: 600,
                                    marginTop: 2,
                                }}
                            >
                                {data.zoneLabel}
                            </div>
                        </div>
                        <ZoneIcon size={32} color={zone.color} style={{ opacity: 0.6 }} />
                    </div>

                    {/* Gauge bar */}
                    <div>
                        <div
                            style={{
                                height: 6,
                                borderRadius: 3,
                                background: "rgba(255,255,255,0.06)",
                                position: "relative",
                                overflow: "hidden",
                            }}
                        >
                            {/* Zone segments */}
                            <div
                                style={{
                                    position: "absolute",
                                    left: 0,
                                    width: "22.5%",
                                    height: "100%",
                                    background: "rgba(34,197,94,0.3)",
                                }}
                            />
                            <div
                                style={{
                                    position: "absolute",
                                    left: "22.5%",
                                    width: "37.5%",
                                    height: "100%",
                                    background: "rgba(234,179,8,0.3)",
                                }}
                            />
                            <div
                                style={{
                                    position: "absolute",
                                    left: "60%",
                                    width: "40%",
                                    height: "100%",
                                    background: "rgba(239,68,68,0.3)",
                                }}
                            />
                            {/* Indicator dot */}
                            <div
                                style={{
                                    position: "absolute",
                                    left: `${gaugePercent}%`,
                                    top: -2,
                                    width: 10,
                                    height: 10,
                                    borderRadius: "50%",
                                    background: zone.color,
                                    border: "2px solid var(--bg-secondary)",
                                    transform: "translateX(-50%)",
                                    transition: "left 0.5s ease",
                                }}
                            />
                        </div>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                fontSize: 9,
                                color: "var(--text-muted)",
                                marginTop: 4,
                            }}
                        >
                            <span>0.45 抄底</span>
                            <span>1.2 定投</span>
                            <span>等待</span>
                        </div>
                    </div>

                    {/* Advice */}
                    <div
                        style={{
                            fontSize: 12,
                            color: "var(--text-secondary)",
                            lineHeight: 1.6,
                            padding: "8px 10px",
                            background: "rgba(255,255,255,0.03)",
                            borderRadius: 8,
                        }}
                    >
                        💡 {zone.advice}
                    </div>

                    {/* Detail metrics */}
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr 1fr",
                            gap: 8,
                        }}
                    >
                        <MetricItem label="200日均价" value={`$${data.ma200.toLocaleString()}`} />
                        <MetricItem label="模型估值" value={`$${data.expectedPrice.toLocaleString()}`} />
                        <MetricItem label="币龄" value={`${data.coinAgeDays} 天`} />
                    </div>
                </div>
            )}

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

function MetricItem({ label, value }: { label: string; value: string }) {
    return (
        <div
            style={{
                padding: "6px 8px",
                borderRadius: 6,
                background: "rgba(255,255,255,0.03)",
            }}
        >
            <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 2 }}>
                {label}
            </div>
            <div
                style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    fontVariantNumeric: "tabular-nums",
                }}
            >
                {value}
            </div>
        </div>
    );
}
