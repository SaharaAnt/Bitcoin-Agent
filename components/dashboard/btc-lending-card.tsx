"use client";

import { useEffect, useState } from "react";
import { RefreshCw, ArrowUpRight, ArrowDownRight, BadgePercent } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

export default function BtcLendingCard() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/market/lending-rates")
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
            <div className="card-glass p-6" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '180px' }}>
                <RefreshCw className="animate-spin text-muted" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="card-glass p-6 min-h-[180px]">
                <h3 className="section-title mb-2">Bitcoin Lending Rates</h3>
                <p style={{ color: "var(--red)", fontSize: 13 }}>{error}</p>
            </div>
        );
    }

    if (!data || !data.current) return null;

    const { current, history } = data;
    const borrowApy = current.borrowApy;
    const supplyApy = current.supplyApy;

    return (
        <div className="card-glass p-6 min-h-[180px] flex flex-col justify-between relative overflow-hidden group">

            {/* Background Chart */}
            {history && history.length > 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-24 opacity-30 pointer-events-none transition-opacity duration-300 group-hover:opacity-50">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={history} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="borrowApyGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--orange)" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="var(--orange)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Area
                                type="monotone"
                                dataKey="borrowApy"
                                stroke="var(--orange)"
                                fillOpacity={1}
                                fill="url(#borrowApyGrad)"
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
                            <BadgePercent size={16} className="text-muted" />
                            DeFi BTC Rates
                        </h3>
                        <p className="text-[11px] text-muted-foreground mt-1">
                            {current.project}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-2">
                    {/* Borrow Rate */}
                    <div>
                        <div className="text-[12px] text-muted-foreground mb-1">Borrow APY</div>
                        <div className="flex items-center gap-2">
                            <span
                                className="font-mono font-bold"
                                style={{ fontSize: 28, color: "var(--orange)", lineHeight: 1 }}
                            >
                                {borrowApy ? borrowApy.toFixed(2) + '%' : 'N/A'}
                            </span>
                        </div>
                    </div>

                    {/* Supply Rate */}
                    <div>
                        <div className="text-[12px] text-muted-foreground mb-1">Deposit APY</div>
                        <div className="flex items-center gap-2">
                            <span
                                className="font-mono font-bold"
                                style={{ fontSize: 24, color: "var(--green)", lineHeight: 1.2 }}
                            >
                                {supplyApy.toFixed(2)}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="relative z-10 mt-4 pt-4 border-t border-[rgba(255,255,255,0.05)] flex justify-between items-center text-[11px] text-muted-foreground">
                <span>TVL: ${(current.tvl / 1e6).toFixed(1)}M</span>
                <span>Borrowed: ${(current.totalBorrow / 1e6).toFixed(1)}M</span>
            </div>
        </div>
    );
}
