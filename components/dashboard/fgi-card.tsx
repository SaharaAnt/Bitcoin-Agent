"use client";

import { useEffect, useState } from "react";
import { Activity } from "lucide-react";

interface FGIData {
    value: number;
    label: string;
}

function getFGIColor(value: number): string {
    if (value <= 25) return "var(--fear-green)";
    if (value <= 45) return "#4ecb71";
    if (value <= 55) return "#ffc107";
    if (value <= 75) return "#ff8c00";
    return "var(--greed-red)";
}

function getFGILabel(value: number): string {
    if (value <= 25) return "极度恐惧";
    if (value <= 45) return "恐惧";
    if (value <= 55) return "中性";
    if (value <= 75) return "贪婪";
    return "极度贪婪";
}

export default function FGICard() {
    const [data, setData] = useState<FGIData | null>(null);
    const [loading, setLoading] = useState(true);

    // Dip Action State
    const [dipResult, setDipResult] = useState<any>(null);
    const [isDipLoading, setIsDipLoading] = useState(false);

    useEffect(() => {
        const fetchFGI = async () => {
            try {
                const res = await fetch("/api/market");
                const json = await res.json();
                setData(json.fgi);
            } catch (err) {
                console.error("Failed to fetch FGI:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchFGI();
        const interval = setInterval(fetchFGI, 60000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="card" style={{ minHeight: 140 }}>
                <div style={{ color: "var(--text-muted)", fontSize: 13 }}>加载中...</div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="card" style={{ minHeight: 140 }}>
                <div style={{ color: "var(--red)", fontSize: 13 }}>数据获取失败</div>
            </div>
        );
    }

    const handleBuyTheDip = async () => {
        setIsDipLoading(true);
        setDipResult(null);
        try {
            const res = await fetch("/api/dip", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ availableFiat: 1000, baseAmount: 100 }) // Demo values
            });
            const result = await res.json();
            setDipResult(result.action);
        } catch (error) {
            console.error("Failed to calculate dip:", error);
        } finally {
            setIsDipLoading(false);
        }
    };

    const color = getFGIColor(data.value);
    const label = getFGILabel(data.value);
    const percentage = data.value;

    return (
        <div className="card">
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 12,
                }}
            >
                <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                    <Activity
                        size={12}
                        style={{ marginRight: 4, verticalAlign: -1 }}
                    />
                    恐惧贪婪指数
                </span>
                <span
                    style={{
                        fontSize: 12,
                        fontWeight: 600,
                        padding: "4px 10px",
                        borderRadius: 8,
                        color,
                        background: `${color}15`,
                    }}
                >
                    {label}
                </span>
            </div>

            <div className="stat-value" style={{ color, marginBottom: 12 }}>
                {data.value}
            </div>

            {/* Progress bar */}
            <div
                style={{
                    height: 6,
                    background: "var(--bg-secondary)",
                    borderRadius: 3,
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        width: `${percentage}%`,
                        height: "100%",
                        background: `linear-gradient(90deg, var(--fear-green), #ffc107, var(--greed-red))`,
                        borderRadius: 3,
                        transition: "width 1s ease",
                    }}
                />
            </div>

            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 6,
                    fontSize: 11,
                    color: "var(--text-muted)",
                }}
            >
                <span>极度恐惧</span>
                <span>极度贪婪</span>
            </div>

            {/* Buy The Dip Section */}
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border-color)" }}>
                <button
                    onClick={handleBuyTheDip}
                    disabled={isDipLoading}
                    style={{
                        width: "100%",
                        padding: "10px",
                        background: isDipLoading ? "var(--bg-secondary)" : "var(--primary)",
                        color: isDipLoading ? "var(--text-muted)" : "white",
                        border: "none",
                        borderRadius: 8,
                        fontWeight: 600,
                        cursor: isDipLoading ? "not-allowed" : "pointer",
                        transition: "background 0.2s",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 8,
                    }}
                >
                    {isDipLoading ? "计算最佳策略中..." : "一键防跌加仓引擎"}
                </button>

                {dipResult && (
                    <div style={{
                        marginTop: 12,
                        padding: 12,
                        background: "var(--bg-secondary)",
                        borderRadius: 8,
                        fontSize: 13,
                        border: dipResult.action === "BUY" ? "1px solid var(--fear-green)" : "1px solid transparent"
                    }}>
                        <div style={{ fontWeight: 600, marginBottom: 8, color: dipResult.action === "BUY" ? "var(--fear-green)" : "var(--text-primary)" }}>
                            策略建议: {dipResult.action === "BUY" ? `买入 $${dipResult.recommendedAmount}` : dipResult.action}
                        </div>
                        <ul style={{ margin: 0, paddingLeft: 16, color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: 4 }}>
                            {dipResult.reasoning.map((reason: string, i: number) => (
                                <li key={i}>{reason}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
