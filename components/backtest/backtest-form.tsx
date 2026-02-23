"use client";

import { useState } from "react";
import { Play, Zap, Calendar, DollarSign, BarChart3 } from "lucide-react";

interface BacktestFormProps {
    onSubmit: (params: {
        startDate: string;
        endDate: string;
        frequency: string;
        amount: number;
        smartDCA: boolean;
        compare: boolean;
        fearThreshold: number;
        greedThreshold: number;
        fearMultiplier: number;
        greedMultiplier: number;
    }) => void;
    loading: boolean;
}

export default function BacktestForm({ onSubmit, loading }: BacktestFormProps) {
    const [startDate, setStartDate] = useState("2020-01-01");
    const [endDate, setEndDate] = useState("2024-12-31");
    const [frequency, setFrequency] = useState("weekly");
    const [amount, setAmount] = useState(100);
    const [smartDCA, setSmartDCA] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [fearThreshold, setFearThreshold] = useState(25);
    const [greedThreshold, setGreedThreshold] = useState(75);
    const [fearMultiplier, setFearMultiplier] = useState(2.0);
    const [greedMultiplier, setGreedMultiplier] = useState(0.5);

    const handleSubmit = () => {
        onSubmit({
            startDate,
            endDate,
            frequency,
            amount,
            smartDCA,
            compare: true,
            fearThreshold,
            greedThreshold,
            fearMultiplier,
            greedMultiplier,
        });
    };

    return (
        <div className="card">
            <h3
                style={{
                    fontSize: 16,
                    fontWeight: 700,
                    marginBottom: 20,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                }}
            >
                <BarChart3 size={18} color="var(--btc-orange)" />
                DCA 回测参数
            </h3>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 16,
                    marginBottom: 16,
                }}
            >
                <div>
                    <label className="label">
                        <Calendar size={12} style={{ marginRight: 4, verticalAlign: -1 }} />
                        开始日期
                    </label>
                    <input
                        className="input"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                </div>
                <div>
                    <label className="label">
                        <Calendar size={12} style={{ marginRight: 4, verticalAlign: -1 }} />
                        结束日期
                    </label>
                    <input
                        className="input"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                </div>
            </div>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 16,
                    marginBottom: 16,
                }}
            >
                <div>
                    <label className="label">定投频率</label>
                    <select
                        className="input"
                        value={frequency}
                        onChange={(e) => setFrequency(e.target.value)}
                    >
                        <option value="daily">每日</option>
                        <option value="weekly">每周</option>
                        <option value="biweekly">每两周</option>
                        <option value="monthly">每月</option>
                    </select>
                </div>
                <div>
                    <label className="label">
                        <DollarSign
                            size={12}
                            style={{ marginRight: 4, verticalAlign: -1 }}
                        />
                        每次金额 (USD)
                    </label>
                    <input
                        className="input"
                        type="number"
                        min={1}
                        value={amount}
                        onChange={(e) => setAmount(Number(e.target.value))}
                    />
                </div>
            </div>

            {/* Smart DCA Toggle */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    background: "var(--bg-secondary)",
                    borderRadius: 12,
                    marginBottom: 16,
                    cursor: "pointer",
                }}
                onClick={() => setSmartDCA(!smartDCA)}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Zap
                        size={16}
                        color={smartDCA ? "var(--btc-orange)" : "var(--text-muted)"}
                    />
                    <span style={{ fontSize: 14, fontWeight: 600 }}>智能 DCA</span>
                    <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                        恐惧加仓 · 贪婪减仓
                    </span>
                </div>
                <div
                    style={{
                        width: 44,
                        height: 24,
                        borderRadius: 12,
                        background: smartDCA
                            ? "var(--btc-orange)"
                            : "var(--border-color)",
                        position: "relative",
                        transition: "background 0.3s",
                    }}
                >
                    <div
                        style={{
                            width: 20,
                            height: 20,
                            borderRadius: 10,
                            background: "white",
                            position: "absolute",
                            top: 2,
                            left: smartDCA ? 22 : 2,
                            transition: "left 0.3s",
                        }}
                    />
                </div>
            </div>

            {/* Advanced Settings */}
            {smartDCA && (
                <div style={{ marginBottom: 16 }}>
                    <button
                        className="btn-secondary"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        style={{
                            width: "100%",
                            fontSize: 13,
                            padding: "8px 14px",
                            marginBottom: 12,
                        }}
                    >
                        {showAdvanced ? "隐藏" : "显示"}高级设置
                    </button>

                    {showAdvanced && (
                        <div
                            className="fade-in"
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: 12,
                            }}
                        >
                            <div>
                                <label className="label">恐惧阈值 (FGI ≤)</label>
                                <input
                                    className="input"
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={fearThreshold}
                                    onChange={(e) => setFearThreshold(Number(e.target.value))}
                                />
                            </div>
                            <div>
                                <label className="label">贪婪阈值 (FGI ≥)</label>
                                <input
                                    className="input"
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={greedThreshold}
                                    onChange={(e) => setGreedThreshold(Number(e.target.value))}
                                />
                            </div>
                            <div>
                                <label className="label">恐惧加仓倍数</label>
                                <input
                                    className="input"
                                    type="number"
                                    min={1}
                                    max={5}
                                    step={0.1}
                                    value={fearMultiplier}
                                    onChange={(e) => setFearMultiplier(Number(e.target.value))}
                                />
                            </div>
                            <div>
                                <label className="label">贪婪减仓倍数</label>
                                <input
                                    className="input"
                                    type="number"
                                    min={0.1}
                                    max={1}
                                    step={0.1}
                                    value={greedMultiplier}
                                    onChange={(e) => setGreedMultiplier(Number(e.target.value))}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            <button
                className="btn-primary"
                onClick={handleSubmit}
                disabled={loading}
                style={{ width: "100%", justifyContent: "center", padding: 14 }}
            >
                {loading ? (
                    <>
                        <div className="spinner" /> 回测中...
                    </>
                ) : (
                    <>
                        <Play size={16} /> 开始回测
                    </>
                )}
            </button>
        </div>
    );
}
