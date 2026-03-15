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

interface Ahr999Data {
    value: number;
    zone: "bottom" | "dca" | "wait";
    zoneLabel: string;
    price: number;
    ma200: number;
    expectedPrice: number;
    coinAgeDays: number;
    timestamp: string;
    history?: Array<{
        date: string;
        value: number;
        zone: "bottom" | "dca" | "wait";
        zoneLabel: string;
        price: number;
        ma200: number;
        expectedPrice: number;
    }>;
}

const ZONE_EXPLANATION: Record<Ahr999Data["zone"], string> = {
    bottom: "处于历史低估区间，长期配置吸引力更强。",
    dca: "处于定投区间，持续小额买入更稳健。",
    wait: "偏高估区间，放缓节奏或等待回撤更合适。",
};

export default function Ahr999Card() {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const { data, loading, error } = useCachedJson<Ahr999Data>("/api/ahr999?history=1", 120_000);

    if (loading) {
        return (
            <div className="card" style={{ minHeight: 180 }}>
                <div style={{ color: "var(--text-muted)", fontSize: 13 }}>加载 Ahr999...</div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="card" style={{ minHeight: 180 }}>
                <div style={{ color: "var(--red)", fontSize: 13 }}>无法获取 Ahr999 数据</div>
            </div>
        );
    }

    const zoneColor =
        data.zone === "bottom" ? "var(--fear-green)" : data.zone === "wait" ? "var(--red)" : "#eab308";

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
                background: `${zoneColor}15`,
                color: zoneColor,
            }}
        >
            <Activity size={12} />
            {data.zoneLabel}
        </span>
    );

    const historyValues = data.history?.map((h) => h.value) ?? [];
    const sparkline = historyValues.length ? historyValues : Array.from({ length: 20 }, () => data.value);
    const historyMin = historyValues.length ? Math.min(...historyValues) : data.value;
    const historyMax = historyValues.length ? Math.max(...historyValues) : data.value;

    return (
        <>
            <IndicatorCard
                title="Ahr999 指标"
                subtitle="估值区间信号"
                value={data.value.toFixed(3)}
                valueColor={zoneColor}
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
                sparklineData={sparkline}
                sparklineColor={zoneColor}
                explanation={ZONE_EXPLANATION[data.zone]}
                footerItems={[
                    { label: "200日均价", value: `$${data.ma200.toLocaleString()}` },
                    { label: "模型估值", value: `$${data.expectedPrice.toLocaleString()}` },
                ]}
                details={
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <Sparkline data={sparkline} stroke={zoneColor} height={80} strokeWidth={2} />
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr 1fr",
                                gap: 8,
                                fontSize: 12,
                                color: "var(--text-secondary)",
                            }}
                        >
                            <div>区间最低: {historyMin.toFixed(3)}</div>
                            <div>区间最高: {historyMax.toFixed(3)}</div>
                            <div>当前区间: {data.zoneLabel}</div>
                        </div>
                    </div>
                }
            />
            <DetailDrawer
                open={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                title="Ahr999 详情"
                subtitle="过去 365 天估值走势"
            >
                {historyValues.length > 0 ? (
                    <div style={{ height: 260 }}>
                        <ResponsiveContainer>
                            <LineChart
                                data={historyValues.map((value: number, index: number) => ({
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
                                    stroke={zoneColor}
                                    dot={false}
                                    strokeWidth={2}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div
                        style={{
                            height: 260,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "var(--text-muted)",
                            fontSize: 14,
                        }}
                    >
                        暂无历史数据 (API 限制或加载中)
                    </div>
                )}
            </DetailDrawer>
        </>
    );
}
