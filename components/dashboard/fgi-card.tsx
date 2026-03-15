"use client";

import { useState } from "react";
import { Activity } from "lucide-react";
import IndicatorCard, { Sparkline } from "@/components/dashboard/indicator-card";
import DetailDrawer from "@/components/dashboard/detail-drawer";
import { useCachedJson } from "@/lib/hooks/use-cached-json";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
} from "recharts";

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
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const { data, loading, error } = useCachedJson<{
        fgi?: FGIData;
        fgiHistory?: number[];
    }>("/api/market", 60_000);

    if (loading || !data) {
        return (
            <div className="card" style={{ minHeight: 140 }}>
                <div style={{ color: "var(--text-muted)", fontSize: 13 }}>加载中...</div>
            </div>
        );
    }

    if (error || !data.fgi) {
        return (
            <div className="card" style={{ minHeight: 140 }}>
                <div style={{ color: "var(--red)", fontSize: 13 }}>无法获取 FGI 数据</div>
            </div>
        );
    }

    const fgi = data.fgi;
    const history = Array.isArray(data.fgiHistory) ? data.fgiHistory : [];
    const color = getFGIColor(fgi.value);
    const label = getFGILabel(fgi.value);
    const historyMin = history.length ? Math.min(...history) : fgi.value;
    const historyMax = history.length ? Math.max(...history) : fgi.value;
    const historyAvg = history.length ? history.reduce((s, v) => s + v, 0) / history.length : fgi.value;

    const badge = (
        <span
            style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 12,
                fontWeight: 700,
                padding: "4px 10px",
                borderRadius: 8,
                background: `${color}15`,
                color,
            }}
        >
            <Activity size={12} />
            {label}
        </span>
    );

    return (
        <>
            <IndicatorCard
                title="恐惧与贪婪"
                subtitle="市场情绪温度计"
                value={`${fgi.value}`}
                valueColor={color}
                badge={badge}
                rightAction={
                    <button
                        onClick={() => setIsDrawerOpen(true)}
                        style={{
                            background: "transparent",
                            color: "var(--text-muted)",
                            border: "1px solid var(--border-color)",
                            padding: "4px 8px",
                            borderRadius: 6,
                            fontSize: 11,
                            cursor: "pointer",
                        }}
                    >
                        详情
                    </button>
                }
                sparklineData={history}
                sparklineColor={color}
                explanation="情绪过热或过冷往往意味着风险累积或机会浮现。"
                footerItems={[
                    { label: "区间", value: label },
                    {
                        label: "建议",
                        value: fgi.value <= 25 ? "考虑加仓" : fgi.value >= 75 ? "注意减仓" : "正常定投",
                    },
                ]}
                details={
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <Sparkline data={history} stroke={color} height={80} strokeWidth={2} />
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr 1fr",
                                gap: 8,
                                fontSize: 12,
                                color: "var(--text-secondary)",
                            }}
                        >
                            <div>30日均值: {historyAvg.toFixed(1)}</div>
                            <div>30日最低: {historyMin}</div>
                            <div>30日最高: {historyMax}</div>
                        </div>
                    </div>
                }
            />
            <DetailDrawer
                open={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                title="FGI 详情"
                subtitle="过去 30 天情绪走势"
            >
                <div style={{ height: 260 }}>
                    <ResponsiveContainer>
                        <LineChart
                            data={history.map((value, index) => ({
                                day: index + 1,
                                value,
                            }))}
                        >
                            <XAxis dataKey="day" hide />
                            <YAxis hide />
                            <Tooltip
                                contentStyle={{
                                    background: "var(--bg-secondary)",
                                    border: "1px solid var(--border-color)",
                                    color: "var(--text-primary)",
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke={color}
                                dot={false}
                                strokeWidth={2}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </DetailDrawer>
        </>
    );
}
