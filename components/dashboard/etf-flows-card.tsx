"use client";

import { useEffect, useState } from "react";
import { RefreshCw, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";

export default function EtfFlowsCard() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/market/etf-flows")
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
            <div className="card-glass p-6" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '140px' }}>
                <RefreshCw className="animate-spin text-muted" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="card-glass p-6" style={{ minHeight: '140px' }}>
                <h3 className="section-title mb-2">Bitcoin ETF Flows</h3>
                <p style={{ color: "var(--red)", fontSize: 13 }}>{error}</p>
                <p style={{ color: "var(--text-muted)", fontSize: 11, marginTop: 4 }}>
                    Please ensure COINGLASS_API_KEY is configured in .env.
                </p>
            </div>
        );
    }

    // Attempt to extract latest data
    let recentInflow = null;
    let fallbackText = null;

    try {
        const list = Array.isArray(data) ? data : (data?.list || data?.data);
        if (list && Array.isArray(list) && list.length > 0) {
            // Get the most recent entry (could be first or last, normally last if sorted by date asc)
            const latest = list[list.length - 1];

            // Look for common field names in CoinGlass API for inflow
            const inflowKey = Object.keys(latest).find(k =>
                k.toLowerCase().includes("inflow") ||
                k.toLowerCase() === "netflow" ||
                k.toLowerCase() === "flow"
            );

            if (inflowKey && !isNaN(parseFloat(latest[inflowKey]))) {
                recentInflow = parseFloat(latest[inflowKey]);
            } else {
                fallbackText = JSON.stringify(latest, null, 2);
            }
        } else {
            fallbackText = JSON.stringify(data, null, 2);
        }
    } catch (e) {
        fallbackText = "Failed to parse API response structure.";
    }

    return (
        <div className="card-glass p-6 min-h-[140px] relative">
            <div className="flex justify-between items-start mb-4">
                <h3 className="section-title">Daily BTC ETF Net Flow</h3>
                {data?.isMock && (
                    <div
                        title={`API Limited: ${data.reason}`}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 10,
                            color: 'var(--orange)',
                            background: 'rgba(249, 115, 22, 0.1)',
                            padding: '4px 8px',
                            borderRadius: 12
                        }}
                    >
                        <AlertTriangle size={12} />
                        Demo Data
                    </div>
                )}
            </div>

            {recentInflow !== null ? (
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div
                        style={{
                            width: 56,
                            height: 56,
                            borderRadius: "50%",
                            background: recentInflow >= 0 ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}
                    >
                        {recentInflow >= 0 ?
                            <TrendingUp size={28} color="var(--green)" /> :
                            <TrendingDown size={28} color="var(--red)" />
                        }
                    </div>
                    <div>
                        <div style={{
                            fontSize: 32,
                            fontWeight: 700,
                            color: recentInflow >= 0 ? "var(--green)" : "var(--red)",
                            fontFamily: "var(--font-mono)",
                            lineHeight: 1.1
                        }}>
                            {recentInflow >= 0 ? "+" : ""}{recentInflow.toFixed(2)}M
                        </div>
                        <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                            Net Flow (USD Millions)
                        </div>
                    </div>
                </div>
            ) : (
                <div style={{ overflow: "hidden" }}>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Latest Raw Record:</p>
                    <pre style={{ fontSize: 10, color: 'var(--text-secondary)', overflow: 'auto', maxHeight: 80, background: 'rgba(0,0,0,0.2)', padding: 8, borderRadius: 4 }}>
                        {fallbackText}
                    </pre>
                </div>
            )}
        </div>
    );
}
