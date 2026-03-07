"use client";

import { useEffect, useState } from "react";
import {
    TrendingUp,
    TrendingDown,
    Landmark,
    ArrowUpRight,
    ArrowDownRight
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    Tooltip,
    ResponsiveContainer,
    Cell
} from "recharts";

type ETFData = {
    metrics: {
        totalNetInflow: number;
        totalNetInflowM: number;
        averageDailyFlowM: number;
        positiveDays: number;
        negativeDays: number;
        totalDays: number;
    };
    latestDay: {
        date: string;
        flow: number;
        flowM: number;
        isPositive: boolean;
    };
    previousDay: {
        date: string;
        flow: number;
        flowM: number;
        isPositive: boolean;
    };
    history14d: { date: string; total: number; totalM: number }[];
};

export default function EtfFlowCard() {
    const [data, setData] = useState<ETFData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchETF() {
            try {
                const res = await fetch("/api/market/etf");
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                }
            } catch (err) {
                console.error("Failed to fetch ETF data:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchETF();
    }, []);

    if (loading) {
        return (
            <div className="card-crypto" style={{ animation: "pulse 2s infinite", minHeight: 280 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                    <Landmark size={18} color="var(--primary-color)" />
                    <h2 style={{ fontSize: 16, fontWeight: 600 }}>现货 ETF 资金流向</h2>
                </div>
                <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ color: "var(--text-muted)", fontSize: 13 }}>拉取华尔街资金数据...</span>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const { metrics, latestDay, history14d } = data;
    const isOverallPositive = metrics.totalNetInflowM > 0;

    // Custom tool tip for chart
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const val = payload[0].value;
            const isPos = val >= 0;
            return (
                <div style={{
                    background: "rgba(10, 10, 15, 0.95)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    padding: "8px 12px",
                    borderRadius: 8,
                    backdropFilter: "blur(10px)",
                }}>
                    <p style={{ margin: "0 0 4px 0", fontSize: 11, color: "var(--text-secondary)" }}>{label}</p>
                    <p style={{
                        margin: 0,
                        fontSize: 13,
                        fontWeight: 700,
                        color: isPos ? "var(--green)" : "var(--red)"
                    }}>
                        {isPos ? "+" : ""}{val.toFixed(1)}M
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="card fade-in">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: "rgba(245, 158, 11, 0.1)", // btc orange hint
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                    }}>
                        <Landmark size={20} color="#f59e0b" />
                    </div>
                    <div>
                        <h2 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 4px 0" }}>比特币现货 ETF</h2>
                        <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                            累计净流入: <span style={{
                                color: isOverallPositive ? "var(--green)" : "var(--red)",
                                fontWeight: 700
                            }}>
                                {isOverallPositive ? "+" : ""}{(metrics.totalNetInflowM / 1000).toFixed(2)}B
                            </span>
                        </div>
                    </div>
                </div>

                <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 4 }}>
                        {latestDay.date}
                    </div>
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        color: latestDay.isPositive ? "var(--green)" : "var(--red)"
                    }}>
                        {latestDay.isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                        <span style={{ fontSize: 18, fontWeight: 800, fontFamily: "var(--font-mono)" }}>
                            {Math.abs(latestDay.flowM).toFixed(1)}M
                        </span>
                    </div>
                </div>
            </div>

            <div style={{
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid rgba(255, 255, 255, 0.03)",
                borderRadius: 12,
                padding: "16px 12px 0 12px",
                height: 140
            }}>
                <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 8, paddingLeft: 4 }}>
                    近14日资金流向 (百万美元)
                </div>
                <ResponsiveContainer width="100%" height={90}>
                    <BarChart data={history14d} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <XAxis
                            dataKey="date"
                            hide
                        />
                        <Tooltip
                            content={<CustomTooltip />}
                            cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
                        />
                        <Bar dataKey="totalM" radius={[4, 4, 4, 4]}>
                            {history14d.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.totalM >= 0 ? "#10b981" : "#ef4444"} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div style={{
                marginTop: 16,
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                fontSize: 12
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)" }}>
                    <span>日平均流入</span>
                    <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>${metrics.averageDailyFlowM.toFixed(1)}M</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)" }}>
                    <span>流入/流出天数</span>
                    <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                        <span style={{ color: "var(--green)" }}>{metrics.positiveDays}</span>
                        {" / "}
                        <span style={{ color: "var(--red)" }}>{metrics.negativeDays}</span>
                    </span>
                </div>
            </div>
        </div>
    );
}
