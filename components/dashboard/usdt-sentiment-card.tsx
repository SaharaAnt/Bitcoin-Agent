"use client";

import { useEffect, useState } from "react";
import { RefreshCw, TrendingUp, TrendingDown, AlertCircle, Info, Activity } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";

export default function UsdtSentimentCard() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/market/usdt-sentiment")
            .then(r => r.json())
            .then(d => {
                if (d.error) setError(d.error);
                else setData(d);
            })
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="card-glass p-6 flex items-center justify-center min-h-[180px]">
                <RefreshCw className="animate-spin text-muted" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="card-glass p-6 min-h-[180px]">
                <h3 className="section-title mb-2">USDT Sentiment</h3>
                <p style={{ color: "var(--red)", fontSize: 13 }}>{error}</p>
            </div>
        );
    }

    if (!data || !data.sentiment) return null;

    const { sentiment, history, current } = data;

    // Determine color based on sentiment label
    const getSentimentColor = (label: string) => {
        switch (label) {
            case "Overheated": return "var(--red)";
            case "Bullish": return "var(--green)";
            case "Bearish": return "var(--red)";
            default: return "var(--text-muted)";
        }
    };

    const sentimentColor = getSentimentColor(sentiment.label);

    return (
        <div className="card-glass p-6 min-h-[180px] flex flex-col justify-between relative overflow-hidden group">

            {/* Background Chart */}
            {history && history.length > 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-24 opacity-20 pointer-events-none transition-opacity duration-300 group-hover:opacity-40">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={history} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="usdtBorrowGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={sentimentColor} stopOpacity={0.8} />
                                    <stop offset="95%" stopColor={sentimentColor} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Area
                                type="monotone"
                                dataKey="borrowApy"
                                stroke={sentimentColor}
                                fillOpacity={1}
                                fill="url(#usdtBorrowGrad)"
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="section-title flex items-center gap-2">
                            <Activity size={16} className="text-muted" />
                            USDT Sentiment
                        </h3>
                        <p className="text-[11px] text-muted-foreground mt-1">
                            Based on {current.project} Borrow Rates
                        </p>
                    </div>
                    <div
                        className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider"
                        style={{ backgroundColor: `${sentimentColor}22`, color: sentimentColor, border: `1px solid ${sentimentColor}44` }}
                    >
                        {sentiment.label}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                        <div className="text-[12px] text-muted-foreground mb-1">Borrow APY</div>
                        <div className="flex items-baseline gap-1">
                            <span
                                className="font-mono font-bold"
                                style={{ fontSize: 28, color: sentimentColor, lineHeight: 1 }}
                            >
                                {current.borrowApy.toFixed(2)}%
                            </span>
                        </div>
                    </div>

                    <div>
                        <div className="text-[12px] text-muted-foreground mb-1">Trading Signal</div>
                        <div className="flex items-center gap-2">
                            <span
                                className="font-bold"
                                style={{ fontSize: 18, color: "var(--text-primary)", lineHeight: 1.2 }}
                            >
                                {sentiment.signal}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="relative z-10 mt-4 pt-4 border-t border-[rgba(255,255,255,0.05)]">
                <p className="text-[11px] text-muted-foreground leading-relaxed flex gap-2">
                    <Info size={12} className="shrink-0 mt-0.5" />
                    {sentiment.description}
                </p>
            </div>
        </div>
    );
}
