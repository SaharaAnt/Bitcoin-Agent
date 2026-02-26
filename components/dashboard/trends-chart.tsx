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
import { TrendingUp, Info } from "lucide-react";

interface TrendsChartProps {
    data: Array<{ date: string; value: number }>;
}

export default function TrendsChart({ data }: TrendsChartProps) {
    if (!data || data.length === 0) {
        return null;
    }

    return (
        <div className="card-crypto fade-in">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <TrendingUp size={18} color="var(--btc-orange)" />
                    <h2 style={{ fontSize: 16, fontWeight: 600 }}>Google 搜索热度 (30天)</h2>
                </div>
                <div title="综合 'Bitcoin', 'Buy Bitcoin', 'Crypto' 的平均热度">
                    <Info size={14} color="var(--text-muted)" />
                </div>
            </div>

            <div style={{ height: 200, width: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--btc-orange)" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="var(--btc-orange)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                            tickFormatter={(val) => val.split("-").slice(1).join("/")}
                            minTickGap={30}
                        />
                        <YAxis hide domain={[0, 100]} />
                        <Tooltip
                            contentStyle={{
                                background: "rgba(10, 10, 15, 0.9)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: 8,
                                fontSize: 12,
                                backdropFilter: "blur(4px)"
                            }}
                            itemStyle={{ color: "var(--btc-orange)" }}
                            labelStyle={{ color: "var(--text-muted)", marginBottom: 4 }}
                            labelFormatter={(label) => `日期: ${label}`}
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="var(--btc-orange)"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorTrend)"
                            animationDuration={1500}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
            <div style={{ marginTop: 12, fontSize: 11, color: "var(--text-muted)", textAlign: "center" }}>
                搜索热度越高，代表散户情绪越狂热。当前热度: <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{data[data.length - 1].value}</span>
            </div>
        </div>
    );
}
