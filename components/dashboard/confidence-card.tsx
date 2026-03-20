"use client";

import { useState } from "react";
import { Gauge, TrendingUp, Clock } from "lucide-react";
import type { MvrvData } from "@/lib/api/mvrv";
import IndicatorCard from "@/components/dashboard/indicator-card";
import DetailDrawer from "@/components/dashboard/detail-drawer";
import { useCachedJson } from "@/lib/hooks/use-cached-json";
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ReferenceLine,
} from "recharts";

export default function ConfidenceCard() {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const { data, loading, error } = useCachedJson<any>("/api/market/mvrv", 120_000);

    if (loading || !data) {
        return (
            <div className="card" style={{ minHeight: 180 }}>
                <div style={{ color: "var(--text-muted)", fontSize: 13 }}>加载信心指数...</div>
            </div>
        );
    }

    const mvrv = data as MvrvData;
    const history = Array.isArray(data.history) ? data.history.map((h: any) => ({
        timestamp: h.timestamp,
        nupl: h.nupl
    })) : [];

    // Determine status and color
    const nupl = mvrv.nupl;
    let statusLabel = "中性";
    let statusColor = "var(--text-secondary)";
    
    if (nupl > 0.5) {
        statusLabel = "极度乐观";
        statusColor = "var(--red)";
    } else if (nupl > 0.2) {
        statusLabel = "乐观";
        statusColor = "var(--btc-orange)";
    } else if (nupl > 0) {
        statusLabel = "复苏";
        statusColor = "var(--yellow)";
    } else if (nupl > -0.2) {
        statusLabel = "恐慌";
        statusColor = "var(--green)";
    } else {
        statusLabel = "极度绝望";
        statusColor = "#10b981"; // Strong green for "Capitulation/Opportunity"
    }

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
                background: `${statusColor}15`,
                color: statusColor,
            }}
        >
            <Gauge size={12} />
            {statusLabel}
        </span>
    );

    const bullCountdown = mvrv.bullCountdown;

    return (
        <>
            <IndicatorCard
                title="投资者信心指数"
                subtitle="NUPL (未实现净损益)"
                value={`${nupl > 0 ? "+" : ""}${nupl.toFixed(3)}`}
                valueColor={statusColor}
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
                sparklineData={history.map((h: { nupl: number }) => h.nupl)}
                sparklineColor={statusColor}
                explanation={`信心指数 (NUPL) 反映持有者的整体盈亏水平。${nupl < 0 ? "当前多数筹码处于亏损，处于熊市区间。" : "当前处于盈利状态，处于牛市/复苏区间。"}`}
                footerItems={[
                    { label: "零轴距离", value: nupl >= 0 ? "已越过" : `${Math.abs(nupl).toFixed(3)}` },
                    { label: "近期速度", value: `${(bullCountdown?.speedPerDay ?? 0) > 0 ? "+" : ""}${(bullCountdown?.speedPerDay ?? 0).toFixed(4)}/天` },
                ]}
                details={
                    <div style={{ 
                        background: "linear-gradient(135deg, var(--bg-secondary), #1a1a2e)",
                        padding: 16,
                        borderRadius: 16,
                        border: "1px solid var(--border-color)",
                        marginTop: 8
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                            <Clock size={18} color="var(--btc-orange)" />
                            <span style={{ fontSize: 14, fontWeight: 600 }}>牛市倒计时 (零轴测算)</span>
                        </div>
                        
                        {bullCountdown && !bullCountdown.isBullish ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                <div style={{ fontSize: 28, fontWeight: 800, color: "var(--btc-orange)" }}>
                                    约 {bullCountdown.daysToZero} 天
                                </div>
                                <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.4 }}>
                                    按过去 10 天信心指数的回升速度测算，预计还需要 {bullCountdown.daysToZero} 天突破零轴，届时将宣告熊市正式结束。
                                </div>
                                <div style={{ 
                                    height: 6, 
                                    background: "rgba(255,255,255,0.05)", 
                                    borderRadius: 3,
                                    marginTop: 8,
                                    overflow: "hidden" 
                                }}>
                                    <div style={{ 
                                        width: `${Math.min(100, Math.max(5, (1 + mvrv.nupl) * 100))}%`, 
                                        height: "100%", 
                                        background: "linear-gradient(90deg, #10b981, var(--btc-orange))" 
                                    }} />
                                </div>
                            </div>
                        ) : (
                            <div style={{ color: "var(--green)", fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                                <TrendingUp size={16} />
                                信心指数已站上零轴，牛市进行中
                            </div>
                        )}
                    </div>
                }
            />
            <DetailDrawer
                open={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                title="投资者信心 (NUPL) 走势"
                subtitle="历史上，跌破 -0.2 为极端底部，站上 0 为牛市开启"
            >
                <div style={{ height: 300, marginTop: 20 }}>
                    <ResponsiveContainer>
                        <AreaChart data={history}>
                            <defs>
                                <linearGradient id="colorNupl" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={statusColor} stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor={statusColor} stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="timestamp" hide />
                            <YAxis domain={[-0.5, 0.8]} hide />
                            <Tooltip
                                contentStyle={{
                                    background: "var(--bg-secondary)",
                                    border: "1px solid var(--border-color)",
                                    borderRadius: 12,
                                    fontSize: 12
                                }}
                                labelFormatter={(t) => new Date(t).toLocaleDateString()}
                            />
                            <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" strokeDasharray="3 3" label={{ position: 'right', value: '零轴', fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} />
                            <ReferenceLine y={-0.2} stroke="rgba(16, 185, 129, 0.3)" strokeDasharray="3 3" label={{ position: 'right', value: '极度绝望', fill: 'rgba(16, 185, 129, 0.4)', fontSize: 10 }} />
                            <Area
                                type="monotone"
                                dataKey="nupl"
                                stroke={statusColor}
                                fillOpacity={1}
                                fill="url(#colorNupl)"
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </DetailDrawer>
        </>
    );
}
