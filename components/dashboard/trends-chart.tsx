"use client";

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";
import { TrendingUp, Info, Users, MessageSquare } from "lucide-react";

interface TrendsChartProps {
    data: Array<{ date: string; value: number }>;
    reddit?: {
        subscribers: number;
        activeAccounts: number;
        postActivity: number;
    };
}

export default function TrendsChart({ data, reddit }: TrendsChartProps) {
    if (!data || data.length === 0) {
        return null;
    }

    const currentValue = data[data.length - 1].value;

    return (
        <div className="card fade-in" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: "rgba(247, 147, 26, 0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                    }}>
                        <TrendingUp size={18} color="var(--btc-orange)" />
                    </div>
                    <div>
                        <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>零售搜索趋势</h2>
                        <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>Google Trends (30D)</p>
                    </div>
                </div>
                <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>{currentValue}</div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--btc-orange)" }}></span>
                        指数热度
                    </div>
                </div>
            </div>

            <div style={{ flex: 1, minHeight: 180, width: "100%", marginTop: 10 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--btc-orange)" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="var(--btc-orange)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                            tickFormatter={(val) => val.split("-").slice(1).join("/")}
                            minTickGap={40}
                        />
                        <YAxis hide domain={[0, 100]} />
                        <Tooltip
                            contentStyle={{
                                background: "rgba(26, 26, 46, 0.95)",
                                border: "1px solid var(--border-color)",
                                borderRadius: 12,
                                fontSize: 12,
                                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.4)",
                                backdropFilter: "blur(10px)"
                            }}
                            itemStyle={{ color: "var(--btc-orange)", fontWeight: 600 }}
                            labelStyle={{ color: "var(--text-secondary)", marginBottom: 4, fontWeight: 500 }}
                            labelFormatter={(label) => `日期: ${label}`}
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="var(--btc-orange)"
                            strokeWidth={2.5}
                            fillOpacity={1}
                            fill="url(#colorTrend)"
                            animationDuration={1500}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
            <div style={{
                marginTop: 16,
                padding: "8px 12px",
                background: "rgba(255,255,255,0.02)",
                borderRadius: 8,
                fontSize: 11,
                color: "var(--text-secondary)",
                display: "flex",
                flexDirection: "column",
                gap: 8
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Info size={14} color="var(--btc-orange)" />
                    综合 Bitcoin, Buy Bitcoin 等关键词，反映大众入场意愿。
                </div>

                {reddit ? (
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 12,
                        marginTop: 4,
                        borderTop: "1px solid rgba(255,255,255,0.05)",
                        paddingTop: 8
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <Users size={12} color="var(--text-muted)" />
                            <span>r/Bitcoin 粉丝: <b style={{ color: "var(--text-primary)" }}>{(reddit.subscribers / 1e6).toFixed(2)}M</b></span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <MessageSquare size={12} color="var(--text-muted)" />
                            <span>活跃度: <b style={{ color: "var(--text-primary)" }}>{reddit.postActivity.toFixed(1)}/day</b></span>
                        </div>
                    </div>
                ) : (
                    <div style={{
                        fontSize: 10,
                        color: "var(--text-muted)",
                        marginTop: 8,
                        paddingTop: 8,
                        borderTop: "1px solid rgba(255,255,255,0.05)",
                        fontStyle: "italic",
                        textAlign: "center"
                    }}>
                        Reddit 深度数据暂时无法获取 (API 限制)
                    </div>
                )}
            </div>
        </div>
    );
}
