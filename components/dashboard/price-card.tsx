"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import PanicSellModal from "@/components/dashboard/panic-sell-modal";
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

interface BtcData {
    price: number;
    change24h: number;
    marketCap: number;
}

export default function PriceCard() {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isSellModalOpen, setIsSellModalOpen] = useState(false);
    const { data, loading, error } = useCachedJson<{
        btc: BtcData;
        fgi?: { value: number };
        btcHistory?: number[];
    }>("/api/market", 30_000);

    if (loading || !data) {
        return (
            <div className="card pulse-glow" style={{ minHeight: 140 }}>
                <div style={{ color: "var(--text-muted)", fontSize: 13 }}>加载中...</div>
            </div>
        );
    }

    if (error || !data.btc) {
        return (
            <div className="card" style={{ minHeight: 140 }}>
                <div style={{ color: "var(--red)", fontSize: 13 }}>无法获取 BTC 数据</div>
            </div>
        );
    }

    const btc = data.btc;
    const fgi = data.fgi?.value ?? 50;
    const history = Array.isArray(data.btcHistory) ? data.btcHistory : [];
    const isPositive = btc.change24h >= 0;
    const historyMin = history.length ? Math.min(...history) : btc.price;
    const historyMax = history.length ? Math.max(...history) : btc.price;
    const historyChange =
        history.length > 1 ? ((history[history.length - 1] - history[0]) / history[0]) * 100 : 0;

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
                background: isPositive ? "rgba(0,210,106,0.1)" : "rgba(255,71,87,0.1)",
                color: isPositive ? "var(--green)" : "var(--red)",
            }}
        >
            {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {isPositive ? "+" : ""}
            {btc.change24h.toFixed(2)}%
        </span>
    );

    const sellAction = (
        <button
            onClick={() => setIsSellModalOpen(true)}
            style={{
                background: "rgba(255, 69, 58, 0.1)",
                color: "var(--red)",
                border: "1px solid rgba(255, 69, 58, 0.3)",
                padding: "6px 10px",
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
            }}
            className="hover-opacity"
        >
            <DollarSign size={12} /> 全仓
        </button>
    );

    return (
        <>
            <IndicatorCard
                title="BTC 价格"
                subtitle="24h 变动 + 市值"
                value={`$${btc.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                valueColor={isPositive ? "var(--green)" : "var(--red)"}
                badge={badge}
                rightAction={
                    <div style={{ display: "flex", gap: 6 }}>
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
                        {sellAction}
                    </div>
                }
                sparklineData={history}
                sparklineColor={isPositive ? "var(--green)" : "var(--red)"}
                explanation="价格反映短期情绪，市值代表资金体量。变化越剧烈，情绪越极端。"
                footerItems={[
                    { label: "市值", value: `$${(btc.marketCap / 1e9).toFixed(0)}B` },
                    { label: "FGI", value: `${fgi}` },
                ]}
                details={
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <Sparkline
                            data={history}
                            stroke={isPositive ? "var(--green)" : "var(--red)"}
                            height={80}
                            strokeWidth={2}
                        />
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr 1fr",
                                gap: 8,
                                fontSize: 12,
                                color: "var(--text-secondary)",
                            }}
                        >
                            <div>30日最低: ${historyMin.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                            <div>30日最高: ${historyMax.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                            <div>30日变化: {historyChange.toFixed(2)}%</div>
                        </div>
                    </div>
                }
            />
            <DetailDrawer
                open={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                title="BTC 价格详情"
                subtitle="过去 30 天价格走势"
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
                                stroke={isPositive ? "var(--green)" : "var(--red)"}
                                dot={false}
                                strokeWidth={2}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </DetailDrawer>
            <PanicSellModal
                isOpen={isSellModalOpen}
                onClose={() => setIsSellModalOpen(false)}
                fgiValue={fgi}
                currentPrice={btc.price}
            />
        </>
    );
}
