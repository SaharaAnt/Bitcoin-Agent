"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import IndicatorCard from "@/components/dashboard/indicator-card";
import DetailDrawer from "@/components/dashboard/detail-drawer";
import { useCachedJson } from "@/lib/hooks/use-cached-json";

interface FansPriceData {
    subscribers: number;
    price: number;
    ratio: number;
    zone: string;
    zoneLabel: string;
    zoneColor: string;
    projectedTopPrice: number;
    projectedBottomPrice: number;
    impliedPE: number;
    benchmarks: Record<string, number>;
    subsGrowthFactor: number;
    timestamp: string;
}

// Classic cycle reference data points from the article
const CYCLE_HISTORY = [
    { label: "2013 双顶 (第一峰)", ratio: 122.7, type: "top" },
    { label: "2013 双顶 (第二峰)", ratio: 64.8, type: "top" },
    { label: "2015 熊底", ratio: 740.0, type: "bottom" },
    { label: "2017 牛顶", ratio: 30.7, type: "top" },
    { label: "2018 熊底", ratio: 290.0, type: "bottom" },
    { label: "2021 高点(约)", ratio: 44.9, type: "top" },
    { label: "预测: 下轮牛顶", ratio: 15.0, type: "projected_top" },
    { label: "预测: 下轮熊底", ratio: 150.0, type: "projected_bottom" },
];

function RatioBar({ current, min = 10, max = 800 }: { current: number; min?: number; max?: number }) {
    // log scale position
    const logMin = Math.log10(min);
    const logMax = Math.log10(max);
    const logCurrent = Math.log10(Math.max(current, min));
    // Inverted: high ratio = left (undervalued), low ratio = right (overvalued)
    const pct = ((logMax - logCurrent) / (logMax - logMin)) * 100;

    const gradientStyle = {
        background: "linear-gradient(to right, #ff0033, #ff6600, #eab308, #22c55e, #00f3ff, #a855f7)",
        height: 8,
        borderRadius: 4,
        position: "relative" as const,
        overflow: "visible" as const,
    };

    const markerStyle = {
        position: "absolute" as const,
        left: `${Math.max(2, Math.min(98, pct))}%`,
        top: "50%",
        transform: "translate(-50%, -50%)",
        width: 14,
        height: 14,
        borderRadius: "50%",
        background: "#fff",
        border: "3px solid #00f3ff",
        boxShadow: "0 0 8px rgba(0,243,255,0.8)",
        zIndex: 2,
    };

    return (
        <div style={{ margin: "8px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-muted)", marginBottom: 4 }}>
                <span>← 低估/熊底</span>
                <span>RATIO: {current.toFixed(1)}</span>
                <span>泡沫/牛顶 →</span>
            </div>
            <div style={gradientStyle}>
                <div style={markerStyle} />
            </div>
        </div>
    );
}

export default function FansPriceCard() {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const { data, loading, error } = useCachedJson<FansPriceData>("/api/market/fans-price", 300_000);

    if (loading) {
        return (
            <div className="card" style={{ minHeight: 180 }}>
                <div style={{ color: "var(--text-muted)", fontSize: 13 }}>加载粉丝币价比...</div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="card" style={{ minHeight: 180 }}>
                <div style={{ color: "var(--red)", fontSize: 13 }}>无法获取粉丝币价比数据</div>
            </div>
        );
    }

    const zoneColor = data.zoneColor;

    const badge = (
        <span
            style={{
                display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700,
                padding: "4px 10px", borderRadius: 8,
                background: `${zoneColor}15`, color: zoneColor,
            }}
        >
            <Users size={12} />
            {data.zoneLabel}
        </span>
    );

    const formattedSubs = (data.subscribers / 1_000_000).toFixed(2) + "M";

    return (
        <>
            <IndicatorCard
                title="粉丝币价比"
                subtitle="基本面 PE 估值"
                value={data.ratio.toFixed(1)}
                valueColor={zoneColor}
                badge={badge}
                rightAction={
                    <button
                        onClick={() => setIsDrawerOpen(true)}
                        style={{
                            background: "transparent", color: "var(--text-muted)",
                            border: "1px solid var(--border-color)", padding: "4px 8px",
                            borderRadius: 6, fontSize: 11, cursor: "pointer",
                        }}
                    >
                        价格推算
                    </button>
                }
                explanation={`r/Bitcoin 粉丝数 (${formattedSubs}) 除以币价，类比 PE 估值。数值越小 → 估值越高; 数值越大 → 估值越低。`}
                footerItems={[
                    { label: "粉丝数", value: `${formattedSubs}` },
                    { label: "预测牛顶价", value: `$${data.projectedTopPrice.toLocaleString()}` },
                ]}
                details={
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <RatioBar current={data.ratio} />
                    </div>
                }
            />
            <DetailDrawer
                open={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                title="粉丝币价比 — 历史推算"
                subtitle="类比 PE 的 BTC 基本面估值模型"
            >
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {/* Current state */}
                    <div
                        style={{
                            background: `${zoneColor}10`, border: `1px solid ${zoneColor}30`,
                            borderRadius: 12, padding: 16,
                        }}
                    >
                        <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 8 }}>当前状态</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, textAlign: "center" }}>
                            <div>
                                <div style={{ fontSize: 22, fontWeight: 800, color: zoneColor }}>{data.ratio.toFixed(1)}</div>
                                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>粉丝币价比</div>
                            </div>
                            <div>
                                <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)" }}>{formattedSubs}</div>
                                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>r/Bitcoin 粉丝</div>
                            </div>
                            <div>
                                <div style={{ fontSize: 22, fontWeight: 800, color: "var(--btc-orange)" }}>
                                    ${data.price.toLocaleString()}
                                </div>
                                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>当前币价</div>
                            </div>
                        </div>
                    </div>

                    {/* Price targets */}
                    <div style={{ background: "var(--bg-secondary)", borderRadius: 12, padding: 16 }}>
                        <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 10, fontWeight: 600 }}>📐 刻舟求剑推算</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: 13, color: "#ff6600" }}>🔴 下轮牛顶 (比率≈15)</span>
                                <span style={{ fontSize: 15, fontWeight: 700, color: "#ff6600" }}>
                                    ${data.projectedTopPrice.toLocaleString()}
                                </span>
                            </div>
                            <div style={{ height: 1, background: "var(--border-color)" }} />
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: 13, color: "#00f3ff" }}>🔵 下轮熊底 (比率≈150)</span>
                                <span style={{ fontSize: 15, fontWeight: 700, color: "#00f3ff" }}>
                                    ${data.projectedBottomPrice.toLocaleString()}
                                </span>
                            </div>
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 10 }}>
                            * 随粉丝数增长，以上目标价会同比例上移。仅供参考。
                        </div>
                    </div>

                    {/* Historical benchmarks */}
                    <div style={{ background: "var(--bg-secondary)", borderRadius: 12, padding: 16 }}>
                        <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 10, fontWeight: 600 }}>📊 历史周期参考极值</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {CYCLE_HISTORY.map((h) => {
                                const color = h.type === "top" ? "#ff6600"
                                    : h.type === "bottom" ? "#00f3ff"
                                    : h.type === "projected_top" ? "#ff0033"
                                    : "#a855f7";
                                return (
                                    <div key={h.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{h.label}</span>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <span style={{ fontSize: 12, fontWeight: 700, color }}>
                                                {h.ratio.toFixed(1)}
                                            </span>
                                            <span style={{ fontSize: 10, color: data.ratio > h.ratio ? "#22c55e" : "#ff6600", minWidth: 64, textAlign: "right" }}>
                                            {data.ratio > h.ratio ? `+${(data.ratio - h.ratio).toFixed(1)}` : `${(data.ratio - h.ratio).toFixed(1)}`}
                                        </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* PE Analogy */}
                    <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.7 }}>
                        <strong style={{ color: "var(--text-secondary)" }}>💡 类比说明：</strong>
                        粉丝数 ≈ 比特币的 EPS（每股盈利/基本面增速），币价 ≈ 市场定价。
                        粉丝币价比 = 粉丝/币价，是 PE 的倒数。数值越小，说明市场给予了更高溢价（牛顶信号）；数值越大，说明被市场低估（熊底机会）。
                    </div>
                </div>
            </DetailDrawer>
        </>
    );
}
