"use client";

import { useEffect, useState } from "react";
import { Activity, Flame, Zap } from "lucide-react";

interface OnchainData {
    mempool: {
        isCongested: boolean;
        fees: {
            fastestFee: number;
            halfHourFee: number;
            hourFee: number;
        };
        reasoning: string;
    };
    liquidations: {
        totalLiquidationsUSD: number;
        longLiquidationsUSD: number;
        shortLiquidationsUSD: number;
        dominantSide: "LONG" | "SHORT" | "NEUTRAL";
        reasoning: string;
    };
    timestamp: number;
}

export default function OnchainCard() {
    const [data, setData] = useState<OnchainData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOnchain = async () => {
            try {
                const res = await fetch("/api/onchain");
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                }
            } catch (err) {
                console.error("Failed to fetch onchain data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchOnchain();
        const interval = setInterval(fetchOnchain, 120000); // 2 mins
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="card" style={{ minHeight: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ color: "var(--text-muted)", fontSize: 13 }}>加载链上数据中...</div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="card" style={{ minHeight: 200 }}>
                <div style={{ color: "var(--red)", fontSize: 13 }}>链上数据获取失败</div>
            </div>
        );
    }

    const { mempool, liquidations } = data;

    // 清算条UI计算
    const totalLiq = liquidations.totalLiquidationsUSD;
    const longPct = (liquidations.longLiquidationsUSD / totalLiq) * 100 || 50;
    const shortPct = 100 - longPct;

    return (
        <div className="card" style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>

            {/* 爆仓清算区域 */}
            <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                    <div style={{ background: "rgba(255, 69, 58, 0.15)", padding: 6, borderRadius: 8 }}>
                        <Flame size={16} color="var(--red)" />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>全网爆仓 / 清算数据 (24H)</span>
                </div>

                <div className="stat-value" style={{ fontSize: 28, marginBottom: 4 }}>
                    <span style={{ fontSize: 16, color: "var(--text-muted)", verticalAlign: 4 }}>$</span>
                    {totalLiq.toLocaleString()}
                    <span style={{ fontSize: 14, color: "var(--text-muted)", marginLeft: 4 }}>M</span>
                </div>

                {/* Long vs Short Bar */}
                <div style={{ margin: "16px 0", height: 8, borderRadius: 4, display: "flex", overflow: "hidden" }}>
                    <div style={{ width: `${longPct}%`, background: "var(--red)", transition: "width 1s" }} title={`多单爆仓: $${liquidations.longLiquidationsUSD}M`} />
                    <div style={{ width: `${shortPct}%`, background: "var(--fear-green)", transition: "width 1s" }} title={`空单爆仓: $${liquidations.shortLiquidationsUSD}M`} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)" }}>
                    <div style={{ color: "var(--red)" }}>多(Long)爆仓 {longPct.toFixed(1)}%</div>
                    <div style={{ color: "var(--fear-green)" }}>空(Short)爆仓 {shortPct.toFixed(1)}%</div>
                </div>

                <div style={{ marginTop: 12, fontSize: 12, lineHeight: 1.5, color: "var(--text-secondary)", background: "var(--bg-secondary)", padding: 12, borderRadius: 8 }}>
                    {liquidations.reasoning}
                </div>
            </div>

            {/* Mempool 拥堵区域 */}
            <div style={{ borderLeft: "1px solid var(--border-color)", paddingLeft: 24 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ background: "rgba(255, 193, 7, 0.15)", padding: 6, borderRadius: 8 }}>
                            <Zap size={16} color="var(--yellow)" />
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 600 }}>网络拥堵及 Gas 费率</span>
                    </div>
                    <span style={{
                        fontSize: 11,
                        padding: "4px 8px",
                        borderRadius: 6,
                        background: mempool.isCongested ? "rgba(255, 69, 58, 0.15)" : "rgba(78, 203, 113, 0.15)",
                        color: mempool.isCongested ? "var(--red)" : "var(--fear-green)"
                    }}>
                        {mempool.isCongested ? "极度拥堵" : "网络畅通"}
                    </span>
                </div>

                <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                    <div style={{ flex: 1, background: "var(--bg-secondary)", padding: 12, borderRadius: 8 }}>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>最快确认 (≈10分钟)</div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: mempool.isCongested ? "var(--red)" : "var(--text-primary)" }}>
                            {mempool.fees.fastestFee} <span style={{ fontSize: 12, fontWeight: 400, color: "var(--text-muted)" }}>sat/vB</span>
                        </div>
                    </div>
                    <div style={{ flex: 1, background: "var(--bg-secondary)", padding: 12, borderRadius: 8 }}>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>半小时确认</div>
                        <div style={{ fontSize: 20, fontWeight: 700 }}>
                            {mempool.fees.halfHourFee} <span style={{ fontSize: 12, fontWeight: 400, color: "var(--text-muted)" }}>sat/vB</span>
                        </div>
                    </div>
                </div>

                <div style={{ fontSize: 12, lineHeight: 1.5, color: "var(--text-secondary)" }}>
                    {mempool.reasoning}
                </div>
            </div>

        </div>
    );
}
