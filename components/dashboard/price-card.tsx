"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import PanicSellModal from "@/components/dashboard/panic-sell-modal";

interface BtcData {
    price: number;
    change24h: number;
    marketCap: number;
}

export default function PriceCard() {
    const [data, setData] = useState<BtcData | null>(null);
    const [fgi, setFgi] = useState<number>(50);
    const [loading, setLoading] = useState(true);
    const [isSellModalOpen, setIsSellModalOpen] = useState(false);

    useEffect(() => {
        const fetchPrice = async () => {
            try {
                const res = await fetch("/api/market");
                const json = await res.json();
                setData(json.btc);
                if (json.fgi) setFgi(json.fgi.value);
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

    return (
        <div className="card pulse-glow">
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 12,
                }}
            >
                <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                    Bitcoin 价格
                </span>
                <span
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 13,
                        fontWeight: 600,
                        padding: "4px 10px",
                        borderRadius: 8,
                        background: isPositive
                            ? "rgba(0,210,106,0.1)"
                            : "rgba(255,71,87,0.1)",
                    }}
                    className={isPositive ? "positive" : "negative"}
                >
                    {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {isPositive ? "+" : ""}
                    {data.change24h.toFixed(2)}%
                </span>
            </div>

            <div className="stat-value btc-gradient">
                ${data.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 8 }}>
                <div className="stat-label">
                    市值: ${(data.marketCap / 1e9).toFixed(0)}B
                </div>

                <button
                    onClick={() => setIsSellModalOpen(true)}
                    style={{
                        background: "rgba(255, 69, 58, 0.1)",
                        color: "var(--red)",
                        border: "1px solid rgba(255, 69, 58, 0.3)",
                        padding: "6px 12px",
                        borderRadius: 6,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.2s"
                    }}
                    className="hover-opacity"
                >
                    <DollarSign size={14} /> 全仓卖出
                </button>
            </div>

            <PanicSellModal
                isOpen={isSellModalOpen}
                onClose={() => setIsSellModalOpen(false)}
                fgiValue={fgi}
                currentPrice={data.price}
            />
        </div>
    );
}
