"use client";

import { useState, useEffect } from "react";
import {
    ComposedChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    ReferenceLine,
    Legend,
} from "recharts";
import { Users, TrendingUp } from "lucide-react";
import { useCachedJson } from "@/lib/hooks/use-cached-json";

interface ChartPoint {
    date: string;
    price: number;
    subs: number;
    ratio: number;
}

interface FansPriceChartData {
    data: ChartPoint[];
    totalDays: number;
    timestamp: string;
}

// Historical bull tops and bear bottoms for reference lines
const KEY_EVENTS = [
    { date: "2013-11-28", label: "2013顶", ratio: 122.7, type: "top" },
    { date: "2015-01-14", label: "2015底", ratio: 740, type: "bottom" },
    { date: "2017-12-17", label: "2017顶", ratio: 30.7, type: "top" },
    { date: "2018-12-15", label: "2018底", ratio: 290, type: "bottom" },
    { date: "2021-04-14", label: "2021顶", ratio: 44.9, type: "top" },
];

// Custom tooltip
function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload || !payload.length) return null;
    const d = payload[0]?.payload as ChartPoint;
    return (
        <div style={{
            background: "rgba(10, 10, 25, 0.97)",
            border: "1px solid rgba(0, 243, 255, 0.3)",
            borderRadius: 10,
            padding: "10px 14px",
            fontSize: 12,
            backdropFilter: "blur(10px)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
        }}>
            <div style={{ color: "var(--text-muted)", marginBottom: 6, fontWeight: 600 }}>{label}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ color: "#ef4444" }}>
                    粉丝币价比: <b>{d?.ratio?.toFixed(1)}</b>
                </div>
                <div style={{ color: "#3b82f6" }}>
                    BTC 价格: <b>${d?.price?.toLocaleString()}</b>
                </div>
                <div style={{ color: "var(--text-secondary)" }}>
                    粉丝数: <b>{(d?.subs / 1e6).toFixed(2)}M</b>
                </div>
            </div>
        </div>
    );
}

export default function FansPriceChart() {
    const { data, loading, error } = useCachedJson<FansPriceChartData>("/api/market/fans-price-chart", 3_600_000);

    if (loading) {
        return (
            <div className="card fade-in" style={{ minHeight: 440, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
                    正在构建粉丝币价比历史图表...（约需数秒）
                </div>
            </div>
        );
    }

    if (error || !data?.data?.length) {
        return (
            <div className="card fade-in" style={{ minHeight: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ color: "var(--red)", fontSize: 13 }}>无法加载历史数据</div>
            </div>
        );
    }

    const chartData = data.data;
    const latest = chartData[chartData.length - 1];

    // For ratio axis: inverted (lower ratio = higher position)
    // We use a reversed domain trick: domain=[maxRatio, minRatio]
    const ratios = chartData.map(d => d.ratio);
    const maxRatio = Math.min(Math.max(...ratios) * 1.05, 1500);
    const minRatio = Math.max(Math.min(...ratios) * 0.95, 5);

    // For price axis: log scale via tickFormatter
    const prices = chartData.map(d => d.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    const formatDate = (val: string) => {
        const [year, month] = val.split("-");
        return `${year.slice(2)}/${month}`;
    };

    return (
        <div className="card fade-in" style={{ display: "flex", flexDirection: "column" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: "rgba(239, 68, 68, 0.1)",
                        display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                        <Users size={18} color="#ef4444" />
                    </div>
                    <div>
                        <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>粉丝币价比 vs BTC 价格</h2>
                        <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>
                            类 PE 估值 · 2013年至今 · {data.totalDays}天
                        </p>
                    </div>
                </div>
                <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#ef4444" }}>{latest?.ratio?.toFixed(1)}</div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)" }}>当前粉丝币价比</div>
                </div>
            </div>

            {/* Legend */}
            <div style={{ display: "flex", gap: 16, marginBottom: 10, fontSize: 11, color: "var(--text-muted)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 24, height: 2, background: "#ef4444", borderRadius: 1 }} />
                    <span>粉丝币价比（逆序坐标：越高=估值越高）</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 24, height: 2, background: "#3b82f6", borderRadius: 1, borderBottom: "2px dashed #3b82f6" }} />
                    <span>BTC 价格（对数坐标）</span>
                </div>
            </div>

            {/* Chart */}
            <div style={{ flex: 1, minHeight: 340, width: "100%" }}>
                <ResponsiveContainer width="100%" height={360}>
                    <ComposedChart data={chartData} margin={{ top: 10, right: 60, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />

                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                            tickFormatter={formatDate}
                            minTickGap={60}
                        />

                        {/* Left Y-axis: Ratio (INVERTED) */}
                        <YAxis
                            yAxisId="ratio"
                            orientation="left"
                            domain={[minRatio, maxRatio]}
                            reversed={true}
                            scale="log"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: "#ef4444" }}
                            tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0)}
                            width={38}
                        />

                        {/* Right Y-axis: Price (log scale) */}
                        <YAxis
                            yAxisId="price"
                            orientation="right"
                            domain={[minPrice * 0.5, maxPrice * 2]}
                            scale="log"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: "#3b82f6" }}
                            tickFormatter={(v) => {
                                if (v >= 100_000) return `$${(v / 1000).toFixed(0)}k`;
                                if (v >= 1_000) return `$${(v / 1000).toFixed(0)}k`;
                                return `$${v}`;
                            }}
                            width={52}
                        />

                        <Tooltip content={<CustomTooltip />} />

                        {/* Reference lines for historical tops/bottoms */}
                        {KEY_EVENTS.map(ev => (
                            <ReferenceLine
                                key={ev.date}
                                yAxisId="ratio"
                                y={ev.ratio}
                                stroke={ev.type === "top" ? "rgba(239,68,68,0.3)" : "rgba(0,243,255,0.25)"}
                                strokeDasharray="4 4"
                                label={{
                                    value: ev.label,
                                    position: "insideLeft",
                                    fill: ev.type === "top" ? "#ef4444" : "#00f3ff",
                                    fontSize: 9,
                                }}
                            />
                        ))}

                        {/* Ratio line (left axis, inverted) */}
                        <Line
                            yAxisId="ratio"
                            type="monotone"
                            dataKey="ratio"
                            stroke="#ef4444"
                            strokeWidth={1.5}
                            dot={false}
                            name="粉丝币价比"
                            animationDuration={1200}
                        />

                        {/* Price line (right axis, log) */}
                        <Line
                            yAxisId="price"
                            type="monotone"
                            dataKey="price"
                            stroke="#3b82f6"
                            strokeWidth={1.5}
                            dot={false}
                            strokeDasharray="6 3"
                            name="BTC 价格"
                            animationDuration={1200}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            {/* Footer info */}
            <div style={{
                marginTop: 12, padding: "8px 12px",
                background: "rgba(255,255,255,0.02)",
                borderRadius: 8, fontSize: 11, color: "var(--text-muted)",
                display: "flex", gap: 16, flexWrap: "wrap"
            }}>
                <div>💡 <b style={{ color: "#ef4444" }}>红线越高</b> = 估值越贵（牛顶特征）；<b style={{ color: "#00f3ff" }}>红线越低</b> = 越便宜（熊底特征）</div>
                <div>📊 粉丝数据：历史采用插值估算，2026.03 起实时抓取 r/Bitcoin</div>
            </div>
        </div>
    );
}
