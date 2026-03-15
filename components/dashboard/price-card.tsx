"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import PanicSellModal from "@/components/dashboard/panic-sell-modal";
import IndicatorCard, { Sparkline } from "@/components/dashboard/indicator-card";

interface BtcData {
    price: number;
    change24h: number;
    marketCap: number;
}

export default function PriceCard() {
    const [data, setData] = useState<BtcData | null>(null);
    const [fgi, setFgi] = useState<number>(50);
    const [history, setHistory] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSellModalOpen, setIsSellModalOpen] = useState(false);

    useEffect(() => {
        const fetchPrice = async () => {
            try {
                const res = await fetch("/api/market");
                const json = await res.json();
                setData(json.btc);
                if (json.fgi) setFgi(json.fgi.value);
                if (Array.isArray(json.btcHistory)) setHistory(json.btcHistory);
            } catch (err) {
                console.error("Failed to fetch BTC price:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchPrice();
        const interval = setInterval(fetchPrice, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="card pulse-glow" style={{ minHeight: 140 }}>
                <div style={{ color: "var(--text-muted)", fontSize: 13 }}>加载中...</div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="card" style={{ minHeight: 140 }}>
                <div style={{ color: "var(--red)", fontSize: 13 }}>数据获取失败</div>
            </div>
        );
    }

    const isPositive = data.change24h >= 0;
    const historyMin = history.length ? Math.min(...history) : data.price;
    const historyMax = history.length ? Math.max(...history) : data.price;
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
            {data.change24h.toFixed(2)}%
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
                value={`$${data.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                valueColor={isPositive ? "var(--green)" : "var(--red)"}
                badge={badge}
                rightAction={sellAction}
                sparklineData={history}
                sparklineColor={isPositive ? "var(--green)" : "var(--red)"}
                explanation="价格反映短期情绪，市值代表资金体量。变化越剧烈，情绪越极端。"
                footerItems={[
                    { label: "市值", value: `$${(data.marketCap / 1e9).toFixed(0)}B` },
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
            <PanicSellModal
                isOpen={isSellModalOpen}
                onClose={() => setIsSellModalOpen(false)}
                fgiValue={fgi}
                currentPrice={data.price}
            />
        </>
    );
}
