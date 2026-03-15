"use client";

import { useEffect, useState } from "react";
import { Activity } from "lucide-react";
import IndicatorCard, { Sparkline } from "@/components/dashboard/indicator-card";

interface FGIData {
    value: number;
    label: string;
}

function getFGIColor(value: number): string {
    if (value <= 25) return "var(--fear-green)";
    if (value <= 45) return "#4ecb71";
    if (value <= 55) return "#ffc107";
    if (value <= 75) return "#ff8c00";
    return "var(--greed-red)";
}

function getFGILabel(value: number): string {
    if (value <= 25) return "极度恐惧";
    if (value <= 45) return "恐惧";
    if (value <= 55) return "中性";
    if (value <= 75) return "贪婪";
    return "极度贪婪";
}

export default function FGICard() {
    const [data, setData] = useState<FGIData | null>(null);
    const [history, setHistory] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFGI = async () => {
            try {
                const res = await fetch("/api/market");
                const json = await res.json();
                setData(json.fgi);
                if (Array.isArray(json.fgiHistory)) setHistory(json.fgiHistory);
            } catch (err) {
                console.error("Failed to fetch FGI:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchFGI();
        const interval = setInterval(fetchFGI, 60000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="card" style={{ minHeight: 140 }}>
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

    const color = getFGIColor(data.value);
    const label = getFGILabel(data.value);
    const historyMin = history.length ? Math.min(...history) : data.value;
    const historyMax = history.length ? Math.max(...history) : data.value;
    const historyAvg =
        history.length ? history.reduce((s, v) => s + v, 0) / history.length : data.value;

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
                background: `${color}15`,
                color,
            }}
        >
            <Activity size={12} />
            {label}
        </span>
    );

    return (
        <IndicatorCard
            title="恐惧与贪婪"
            subtitle="市场情绪温度计"
            value={`${data.value}`}
            valueColor={color}
            badge={badge}
            sparklineData={history}
            sparklineColor={color}
            explanation="情绪指标过热或过冷往往意味着风险累积或机会浮现。"
            footerItems={[
                { label: "区间", value: label },
                { label: "建议", value: data.value <= 25 ? "考虑加仓" : data.value >= 75 ? "注意减仓" : "正常定投" },
            ]}
            details={
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <Sparkline data={history} stroke={color} height={80} strokeWidth={2} />
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr 1fr",
                            gap: 8,
                            fontSize: 12,
                            color: "var(--text-secondary)",
                        }}
                    >
                        <div>30日均值: {historyAvg.toFixed(1)}</div>
                        <div>30日最低: {historyMin}</div>
                        <div>30日最高: {historyMax}</div>
                    </div>
                </div>
            }
        />
    );
}
