"use client";

import { useState } from "react";
import { Activity } from "lucide-react";
import type { MvrvData } from "@/lib/api/mvrv";
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

function formatCap(val: number): string {
    if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
    if (val >= 1e9) return `$${(val / 1e9).toFixed(0)}B`;
    return `$${val.toLocaleString()}`;
}

export default function MvrvCard() {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const { data, loading, error } = useCachedJson<any>("/api/market/mvrv", 120_000);

    if (loading || !data) {
        return (
            <div className="card" style={{ minHeight: 180 }}>
                <div style={{ color: "var(--text-muted)", fontSize: 13 }}>加载 MVRV...</div>
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

    const mvrv = data as MvrvData;
    const history = Array.isArray(data.history) ? data.history.map((h: { zScore: number }) => h.zScore) : [];
    const historyMin = history.length ? Math.min(...history) : mvrv.zScore;
    const historyMax = history.length ? Math.max(...history) : mvrv.zScore;

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
                background: `${mvrv.zoneColor}15`,
                color: mvrv.zoneColor,
            }}
        >
            <Activity size={12} />
            {mvrv.zoneLabel}
        </span>
    );

    const sparkline = Array.from({ length: 20 }, () => mvrv.zScore);
    const sparklineData = history.length ? history : sparkline;

    return (
        <>
            <IndicatorCard
                title="MVRV Z-Score"
                subtitle="估值偏离度"
                value={`${mvrv.zScore > 0 ? "+" : ""}${mvrv.zScore.toFixed(2)}`}
                valueColor={mvrv.zoneColor}
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
                sparklineData={sparklineData}
                sparklineColor={mvrv.zoneColor}
                explanation={mvrv.description}
                footerItems={[
                    { label: "MVRV", value: `${mvrv.mvrv.toFixed(2)}x` },
                    { label: "市值", value: formatCap(mvrv.marketCap) },
                    { label: "实现市值", value: formatCap(mvrv.realizedCap) },
                ]}
                details={
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <Sparkline data={sparklineData} stroke={mvrv.zoneColor} height={80} strokeWidth={2} />
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr 1fr",
                                gap: 8,
                                fontSize: 12,
                                color: "var(--text-secondary)",
                            }}
                        >
                            <div>区间最低: {historyMin.toFixed(2)}</div>
                            <div>区间最高: {historyMax.toFixed(2)}</div>
                            <div>当前区间: {mvrv.zoneLabel}</div>
                        </div>
                    </div>
                }
            />
            <DetailDrawer
                open={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                title="MVRV 详情"
                subtitle="过去 2 年估值走势"
            >
                <div style={{ height: 260 }}>
                    <ResponsiveContainer>
                        <LineChart
                            data={sparklineData.map((value: number, index: number) => ({
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
                                stroke={mvrv.zoneColor}
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
