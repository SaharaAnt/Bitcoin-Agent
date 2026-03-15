"use client";

import { useEffect, useState } from "react";
import { Activity } from "lucide-react";
import type { MvrvData } from "@/lib/api/mvrv";
import IndicatorCard, { Sparkline } from "@/components/dashboard/indicator-card";

function formatCap(val: number): string {
    if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
    if (val >= 1e9) return `$${(val / 1e9).toFixed(0)}B`;
    return `$${val.toLocaleString()}`;
}

export default function MvrvCard() {
    const [data, setData] = useState<MvrvData | null>(null);
    const [history, setHistory] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch("/api/market/mvrv");
                if (!res.ok) throw new Error("Failed");
                const json = await res.json();
                setData(json);
                if (Array.isArray(json.history)) {
                    setHistory(json.history.map((h: { zScore: number }) => h.zScore));
                }
            } catch {
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
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

    const historyMin = history.length ? Math.min(...history) : data.zScore;
    const historyMax = history.length ? Math.max(...history) : data.zScore;

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
                background: `${data.zoneColor}15`,
                color: data.zoneColor,
            }}
        >
            <Activity size={12} />
            {data.zoneLabel}
        </span>
    );

    const sparkline = Array.from({ length: 20 }, () => data.zScore);
    const sparklineData = history.length ? history : sparkline;

    return (
        <IndicatorCard
            title="MVRV Z-Score"
            subtitle="估值偏离度"
            value={`${data.zScore > 0 ? "+" : ""}${data.zScore.toFixed(2)}`}
            valueColor={data.zoneColor}
            badge={badge}
            sparklineData={sparklineData}
            sparklineColor={data.zoneColor}
            explanation={data.description}
            footerItems={[
                { label: "MVRV", value: `${data.mvrv.toFixed(2)}x` },
                { label: "市值", value: formatCap(data.marketCap) },
                { label: "实现市值", value: formatCap(data.realizedCap) },
            ]}
            details={
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <Sparkline data={sparklineData} stroke={data.zoneColor} height={80} strokeWidth={2} />
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
                        <div>当前区间: {data.zoneLabel}</div>
                    </div>
                </div>
            }
        />
    );
}
