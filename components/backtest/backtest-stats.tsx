"use client";

import { TrendingUp, Coins, Target, AlertTriangle } from "lucide-react";

interface StatsProps {
    standard: {
        totalInvested: number;
        totalBTC: number;
        finalValue: number;
        roi: number;
        annualizedReturn: number;
        maxDrawdown: number;
        averageCost: number;
    };
    smart: {
        totalInvested: number;
        totalBTC: number;
        finalValue: number;
        roi: number;
        annualizedReturn: number;
        maxDrawdown: number;
        averageCost: number;
    };
    lumpSum: {
        totalInvested: number;
        totalBTC: number;
        finalValue: number;
        roi: number;
        annualizedReturn: number;
        maxDrawdown: number;
        averageCost: number;
    };
}

function StatCard({
    label,
    icon,
    standard,
    smart,
    lumpSum,
    format = "usd",
}: {
    label: string;
    icon: React.ReactNode;
    standard: number;
    smart: number;
    lumpSum: number;
    format?: "usd" | "btc" | "percent";
}) {
    const fmt = (v: number) => {
        switch (format) {
            case "usd":
                return `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
            case "btc":
                return `${v.toFixed(6)} ₿`;
            case "percent":
                return `${v.toFixed(2)}%`;
        }
    };

    // Find best strategy for this metric
    const values = [
        { name: "标准", val: standard },
        { name: "智能", val: smart },
        { name: "梭哈", val: lumpSum },
    ];

    return (
        <div className="card" style={{ padding: 16 }}>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 12,
                    color: "var(--text-secondary)",
                    fontSize: 13,
                }}
            >
                {icon}
                {label}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {values.map((v) => (
                    <div
                        key={v.name}
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <span
                            style={{
                                fontSize: 12,
                                color:
                                    v.name === "标准"
                                        ? "#3b82f6"
                                        : v.name === "智能"
                                            ? "var(--btc-orange)"
                                            : "#8b5cf6",
                                fontWeight: 600,
                            }}
                        >
                            {v.name}
                        </span>
                        <span
                            style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: 14,
                                fontWeight: 600,
                            }}
                        >
                            {fmt(v.val)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function BacktestStats({
    standard,
    smart,
    lumpSum,
}: StatsProps) {
    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 12,
            }}
        >
            <StatCard
                label="穿越周期的结果 (最终价值)"
                icon={<TrendingUp size={14} />}
                standard={standard.finalValue}
                smart={smart.finalValue}
                lumpSum={lumpSum.finalValue}
                format="usd"
            />
            <StatCard
                label="时间的朋友 (总持有 BTC)"
                icon={<Coins size={14} />}
                standard={standard.totalBTC}
                smart={smart.totalBTC}
                lumpSum={lumpSum.totalBTC}
                format="btc"
            />
            <StatCard
                label="投资回报率"
                icon={<Target size={14} />}
                standard={standard.roi}
                smart={smart.roi}
                lumpSum={lumpSum.roi}
                format="percent"
            />
            <StatCard
                label="复利的力量 (年化收益)"
                icon={<TrendingUp size={14} />}
                standard={standard.annualizedReturn}
                smart={smart.annualizedReturn}
                lumpSum={lumpSum.annualizedReturn}
                format="percent"
            />
            <StatCard
                label="最大恐惧考验 (最大回撤)"
                icon={<AlertTriangle size={14} />}
                standard={standard.maxDrawdown}
                smart={smart.maxDrawdown}
                lumpSum={lumpSum.maxDrawdown}
                format="percent"
            />
            <StatCard
                label="平均底仓成本"
                icon={<Coins size={14} />}
                standard={standard.averageCost}
                smart={smart.averageCost}
                lumpSum={lumpSum.averageCost}
                format="usd"
            />
        </div>
    );
}
