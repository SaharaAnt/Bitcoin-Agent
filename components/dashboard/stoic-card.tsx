"use client";

import { useEffect, useState } from "react";
import { History, TrendingUp, TrendingDown, BookOpen } from "lucide-react";
import type { HistoricalEvent } from "@/lib/api/stoic-backtest";
import { formatROI } from "@/lib/api/stoic-backtest";

interface StoicData {
    events: HistoricalEvent[];
    timestamp: number;
}

export default function StoicCard() {
    const [data, setData] = useState<StoicData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStoicData = async () => {
            try {
                const res = await fetch("/api/stoic");
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                }
            } catch (err) {
                console.error("Failed to fetch stoic data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchStoicData();
        // Rare updates needed for historical data, but could refresh daily
    }, []);

    if (loading) {
        return (
            <div className="card" style={{ minHeight: 180, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ color: "var(--text-muted)", fontSize: 13 }}>回溯斯多葛历史时刻中...</div>
            </div>
        );
    }

    if (!data || !data.events.length) {
        return (
            <div className="card" style={{ minHeight: 180 }}>
                <div style={{ color: "var(--red)", fontSize: 13 }}>未能获取历史回测数据</div>
            </div>
        );
    }

    return (
        <div className="card" style={{ gridColumn: "1 / -1" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ background: "rgba(168, 85, 247, 0.15)", padding: 6, borderRadius: 8 }}>
                    <BookOpen size={18} color="#a855f7" />
                </div>
                <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>历史极度恐慌回测 (Stoic Pattern)</h3>
                    <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "2px 0 0 0" }}>“阻碍行动的事物将促进前行，挡在路上的事物将成为道路。” —— 马可·奥勒留</p>
                </div>
            </div>

            <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                        <tr style={{ borderBottom: "1px solid var(--border-color)", color: "var(--text-secondary)", textAlign: "left" }}>
                            <th style={{ padding: "12px 8px", fontWeight: 500 }}>历史绝望时刻</th>
                            <th style={{ padding: "12px 8px", fontWeight: 500 }}>恐慌指数(FGI)</th>
                            <th style={{ padding: "12px 8px", fontWeight: 500 }}>当时 BTC 价格</th>
                            <th style={{ padding: "12px 8px", fontWeight: 500 }}>1年期 回报</th>
                            <th style={{ padding: "12px 8px", fontWeight: 500 }}>2年期 回报</th>
                            <th style={{ padding: "12px 8px", fontWeight: 500 }}>持有至今 回报</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.events.map((event) => (
                            <tr key={event.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                                <td style={{ padding: "12px 8px", color: "var(--text-primary)", fontWeight: 500 }}>
                                    <div style={{ fontSize: 12 }}>{event.date}</div>
                                    <div style={{ fontSize: 13 }}>{event.eventName}</div>
                                </td>
                                <td style={{ padding: "12px 8px" }}>
                                    <span style={{
                                        padding: "2px 6px",
                                        borderRadius: 4,
                                        background: "rgba(255, 69, 58, 0.15)",
                                        color: "var(--red)",
                                        fontWeight: 600,
                                        fontSize: 12
                                    }}>
                                        {event.fgiAtEvent}
                                    </span>
                                </td>
                                <td style={{ padding: "12px 8px", color: "var(--text-secondary)" }}>
                                    ${event.btcPriceAtEvent.toLocaleString()}
                                </td>
                                <td style={{ padding: "12px 8px" }}>
                                    <ROIBadge roi={event.roi1Year} />
                                </td>
                                <td style={{ padding: "12px 8px" }}>
                                    <ROIBadge roi={event.roi2Year} />
                                </td>
                                <td style={{ padding: "12px 8px" }}>
                                    <ROIBadge roi={event.roiCurrent} isHighlight />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div style={{ marginTop: 16, padding: 12, background: "var(--bg-secondary)", borderRadius: 8, fontSize: 12, color: "var(--text-muted)", display: "flex", gap: 8, alignItems: "flex-start" }}>
                <History size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                <span>
                    <strong>斯多葛沉思：</strong> 我们无法控制外部市场行情的无情暴跌（正如312或FTX暴雷），唯一能控制的是对暴跌的反应。历史数据表明，在极度恐慌（FGI &lt; 15）时买入并坚定持有（承受短期的波动而不卖出），通常会带来超额的回报奖励。市场的绝望，正是理性的买点。
                </span>
            </div>
        </div>
    );
}

function ROIBadge({ roi, isHighlight = false }: { roi?: number; isHighlight?: boolean }) {
    if (roi === undefined || roi === null) return <span style={{ color: "var(--text-muted)" }}>N/A</span>;

    const isPositive = roi >= 0;
    const color = isPositive ? "var(--fear-green)" : "var(--red)";
    const bg = isPositive ? "rgba(78, 203, 113, 0.15)" : "rgba(255, 69, 58, 0.15)";
    const Icon = isPositive ? TrendingUp : TrendingDown;

    return (
        <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            color,
            background: bg,
            padding: "4px 8px",
            borderRadius: 6,
            fontWeight: isHighlight ? 700 : 500,
            fontSize: isHighlight ? 13 : 12,
        }}>
            <Icon size={12} />
            {formatROI(roi)}
        </div>
    );
}
