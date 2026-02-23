"use client";

import { useState, useEffect, useCallback } from "react";
import {
    TrendingUp,
    TrendingDown,
    Minus,
    RefreshCw,
    Brain,
    AlertTriangle,
    ArrowDown,
    ArrowUp,
    ChevronRight,
} from "lucide-react";

interface MarketAnalysis {
    signal: string;
    signalLabel: string;
    fgi: {
        value: number;
        label: string;
        trend: "falling" | "rising" | "stable";
        avg7d: number;
    };
    btc: {
        price: number;
        change24h: number;
    };
    suggestion: {
        frequency: string;
        fearThreshold: number;
        greedThreshold: number;
        fearMultiplier: number;
        greedMultiplier: number;
        reasoning: string[];
    };
    confidence: number;
    timestamp: string;
}

const SIGNAL_COLORS: Record<string, string> = {
    strong_buy: "#22c55e",
    buy: "#4ade80",
    neutral: "#eab308",
    reduce: "#f97316",
    strong_reduce: "#ef4444",
};

const SIGNAL_BG: Record<string, string> = {
    strong_buy: "rgba(34, 197, 94, 0.12)",
    buy: "rgba(74, 222, 128, 0.10)",
    neutral: "rgba(234, 179, 8, 0.10)",
    reduce: "rgba(249, 115, 22, 0.10)",
    strong_reduce: "rgba(239, 68, 68, 0.12)",
};

const FREQ_LABELS: Record<string, string> = {
    daily: "每日",
    weekly: "每周",
    biweekly: "双周",
    monthly: "每月",
};

export default function StrategyAdvisor() {
    const [analysis, setAnalysis] = useState<MarketAnalysis | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAnalysis = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/strategy-advice");
            if (!res.ok) throw new Error(`${res.status}`);
            const data = await res.json();
            setAnalysis(data);
        } catch (err) {
            setError("获取策略建议失败");
            console.error("[strategy-advisor]", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAnalysis();
    }, [fetchAnalysis]);

    const signalColor = analysis
        ? SIGNAL_COLORS[analysis.signal] ?? "#eab308"
        : "#666";
    const signalBg = analysis
        ? SIGNAL_BG[analysis.signal] ?? "rgba(234,179,8,0.1)"
        : "transparent";

    const TrendIcon =
        analysis?.fgi.trend === "falling"
            ? TrendingDown
            : analysis?.fgi.trend === "rising"
                ? TrendingUp
                : Minus;

    return (
        <div
            className="glass-card"
            style={{
                padding: 20,
                borderRadius: 16,
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-color)",
                position: "relative",
                overflow: "hidden",
            }}
        >
            {/* Accent glow */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background: `linear-gradient(90deg, ${signalColor}, transparent)`,
                }}
            />

            {/* Header */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 16,
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Brain size={18} color={signalColor} />
                    <h3
                        style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: "var(--text-primary)",
                        }}
                    >
                        AI 策略建议
                    </h3>
                </div>
                <button
                    onClick={fetchAnalysis}
                    disabled={loading}
                    style={{
                        background: "none",
                        border: "1px solid var(--border-color)",
                        borderRadius: 8,
                        padding: "4px 8px",
                        cursor: loading ? "wait" : "pointer",
                        color: "var(--text-secondary)",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 12,
                        transition: "all 0.2s",
                    }}
                >
                    <RefreshCw
                        size={12}
                        style={{
                            animation: loading ? "spin 1s linear infinite" : "none",
                        }}
                    />
                    刷新
                </button>
            </div>

            {/* Loading */}
            {loading && !analysis && (
                <div
                    style={{
                        textAlign: "center",
                        padding: "32px 0",
                        color: "var(--text-muted)",
                        fontSize: 13,
                    }}
                >
                    <RefreshCw
                        size={20}
                        style={{
                            animation: "spin 1s linear infinite",
                            margin: "0 auto 8px",
                            display: "block",
                        }}
                    />
                    正在分析市场数据...
                </div>
            )}

            {error && (
                <div
                    style={{
                        textAlign: "center",
                        padding: "24px 0",
                        color: "#ef4444",
                        fontSize: 13,
                    }}
                >
                    <AlertTriangle
                        size={20}
                        style={{ margin: "0 auto 8px", display: "block" }}
                    />
                    {error}
                </div>
            )}

            {/* Content */}
            {analysis && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {/* Signal badge */}
                    <div
                        style={{
                            background: signalBg,
                            border: `1px solid ${signalColor}33`,
                            borderRadius: 12,
                            padding: "12px 16px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <div>
                            <div
                                style={{
                                    fontSize: 18,
                                    fontWeight: 800,
                                    color: signalColor,
                                }}
                            >
                                {analysis.signalLabel}
                            </div>
                            <div
                                style={{
                                    fontSize: 11,
                                    color: "var(--text-muted)",
                                    marginTop: 2,
                                }}
                            >
                                置信度 {analysis.confidence}%
                            </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                            <div
                                style={{
                                    fontSize: 13,
                                    color: "var(--text-secondary)",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 4,
                                }}
                            >
                                FGI
                                <span
                                    style={{
                                        fontWeight: 700,
                                        fontSize: 20,
                                        color: signalColor,
                                    }}
                                >
                                    {analysis.fgi.value}
                                </span>
                            </div>
                            <div
                                style={{
                                    fontSize: 11,
                                    color: "var(--text-muted)",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 3,
                                    justifyContent: "flex-end",
                                }}
                            >
                                <TrendIcon size={11} />
                                7日均值 {analysis.fgi.avg7d}
                            </div>
                        </div>
                    </div>

                    {/* Suggested parameters */}
                    <div>
                        <div
                            style={{
                                fontSize: 12,
                                fontWeight: 600,
                                color: "var(--text-secondary)",
                                marginBottom: 8,
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                            }}
                        >
                            <ChevronRight size={12} />
                            推荐参数
                        </div>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: 8,
                            }}
                        >
                            <ParamItem
                                label="定投频率"
                                value={
                                    FREQ_LABELS[analysis.suggestion.frequency] ??
                                    analysis.suggestion.frequency
                                }
                            />
                            <ParamItem
                                label="恐惧阈值"
                                value={`≤ ${analysis.suggestion.fearThreshold}`}
                            />
                            <ParamItem
                                label="恐惧加仓"
                                value={`${analysis.suggestion.fearMultiplier}x`}
                                highlight={analysis.suggestion.fearMultiplier > 2}
                            />
                            <ParamItem
                                label="贪婪减仓"
                                value={`${analysis.suggestion.greedMultiplier}x`}
                                highlight={analysis.suggestion.greedMultiplier < 0.5}
                            />
                        </div>
                    </div>

                    {/* Reasoning */}
                    <div>
                        <div
                            style={{
                                fontSize: 12,
                                fontWeight: 600,
                                color: "var(--text-secondary)",
                                marginBottom: 6,
                            }}
                        >
                            💡 分析理由
                        </div>
                        <ul
                            style={{
                                margin: 0,
                                paddingLeft: 16,
                                fontSize: 12,
                                color: "var(--text-secondary)",
                                lineHeight: 1.7,
                            }}
                        >
                            {analysis.suggestion.reasoning.map((r, i) => (
                                <li key={i}>{r}</li>
                            ))}
                        </ul>
                    </div>

                    {/* BTC info bar */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "8px 12px",
                            borderRadius: 8,
                            background: "rgba(255,255,255,0.03)",
                            fontSize: 12,
                        }}
                    >
                        <span style={{ color: "var(--text-muted)" }}>
                            BTC ${analysis.btc.price.toLocaleString()}
                        </span>
                        <span
                            style={{
                                color:
                                    analysis.btc.change24h >= 0 ? "#4ade80" : "#ef4444",
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                                fontWeight: 600,
                            }}
                        >
                            {analysis.btc.change24h >= 0 ? (
                                <ArrowUp size={11} />
                            ) : (
                                <ArrowDown size={11} />
                            )}
                            {Math.abs(analysis.btc.change24h).toFixed(2)}%
                        </span>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

function ParamItem({
    label,
    value,
    highlight = false,
}: {
    label: string;
    value: string;
    highlight?: boolean;
}) {
    return (
        <div
            style={{
                padding: "8px 10px",
                borderRadius: 8,
                background: highlight
                    ? "rgba(249, 115, 22, 0.08)"
                    : "rgba(255,255,255,0.03)",
                border: highlight
                    ? "1px solid rgba(249,115,22,0.2)"
                    : "1px solid transparent",
            }}
        >
            <div
                style={{
                    fontSize: 10,
                    color: "var(--text-muted)",
                    marginBottom: 2,
                }}
            >
                {label}
            </div>
            <div
                style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: highlight ? "#f97316" : "var(--text-primary)",
                }}
            >
                {value}
            </div>
        </div>
    );
}
