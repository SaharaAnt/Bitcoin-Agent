"use client";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";

interface ChartDataPoint {
    date: string;
    standardValue?: number;
    smartValue?: number;
    lumpSumValue?: number;
    invested?: number;
}

interface BacktestChartProps {
    standardBuys: Array<{
        date: string;
        portfolioValue: number;
        totalInvested: number;
    }>;
    smartBuys: Array<{
        date: string;
        portfolioValue: number;
        totalInvested: number;
    }>;
    lumpSumBuys: Array<{
        date: string;
        portfolioValue: number;
        totalInvested: number;
    }>;
}

const formatUSD = (value: number) => {
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
};

export default function BacktestChart({
    standardBuys,
    smartBuys,
    lumpSumBuys,
}: BacktestChartProps) {
    // Merge all data into chart-friendly format
    const dateMap = new Map<string, ChartDataPoint>();

    for (const buy of standardBuys) {
        const existing = dateMap.get(buy.date) || { date: buy.date };
        existing.standardValue = buy.portfolioValue;
        existing.invested = buy.totalInvested;
        dateMap.set(buy.date, existing);
    }

    for (const buy of smartBuys) {
        const existing = dateMap.get(buy.date) || { date: buy.date };
        existing.smartValue = buy.portfolioValue;
        dateMap.set(buy.date, existing);
    }

    for (const buy of lumpSumBuys) {
        const existing = dateMap.get(buy.date) || { date: buy.date };
        existing.lumpSumValue = buy.portfolioValue;
        dateMap.set(buy.date, existing);
    }

    const chartData = Array.from(dateMap.values()).sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Sample data points to avoid overcrowding
    const maxPoints = 150;
    const step = Math.max(1, Math.floor(chartData.length / maxPoints));
    const sampledData = chartData.filter((_, i) => i % step === 0);

    return (
        <div className="card">
            <div style={{ marginBottom: 20 }}>
                <h3
                    style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: "var(--text)",
                    }}
                >
                    📈 穿越牛熊的试炼 (策略对比)
                </h3>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>
                    黄色线条展示了“在极度恐惧中加仓”的力量
                </p>
            </div>

            <ResponsiveContainer width="100%" height={350}>
                <LineChart data={sampledData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
                    <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: "#8888a0" }}
                        tickFormatter={(val) => val.substring(0, 7)}
                        interval="preserveStartEnd"
                    />
                    <YAxis
                        tick={{ fontSize: 11, fill: "#8888a0" }}
                        tickFormatter={formatUSD}
                        width={60}
                    />
                    <Tooltip
                        contentStyle={{
                            background: "#1a1a2e",
                            border: "1px solid #2a2a3e",
                            borderRadius: 12,
                            fontSize: 13,
                        }}
                        formatter={((value: number | string | undefined) => [
                            `$${Number(value ?? 0).toLocaleString()}`,
                            "",
                        ]) as never}
                        labelFormatter={(label) => `日期: ${label}`}
                    />
                    <Legend
                        wrapperStyle={{ fontSize: 12, paddingTop: 10 }}
                    />
                    <Line
                        type="monotone"
                        dataKey="invested"
                        name="纪律投入 (本金)"
                        stroke="#555"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                    />
                    <Line
                        type="monotone"
                        dataKey="standardValue"
                        name="标准定投"
                        stroke="#3b82f6"
                        strokeWidth={1.5}
                        strokeOpacity={0.7}
                        dot={false}
                    />
                    <Line
                        type="monotone"
                        dataKey="smartValue"
                        name="逆向积累 (智能定投)"
                        stroke="#f7931a"
                        strokeWidth={3}
                        dot={false}
                    />
                    <Line
                        type="monotone"
                        dataKey="lumpSumValue"
                        name="一次性买入"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        dot={false}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
