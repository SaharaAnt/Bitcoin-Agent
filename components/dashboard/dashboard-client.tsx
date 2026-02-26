"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Bitcoin, LogOut } from "lucide-react";
import PriceCard from "@/components/dashboard/price-card";
import FGICard from "@/components/dashboard/fgi-card";
import BacktestForm from "@/components/backtest/backtest-form";
import BacktestChart from "@/components/backtest/backtest-chart";
import BacktestStats from "@/components/backtest/backtest-stats";
import ChatPanel from "@/components/chat/chat-panel";
import StrategyAdvisor from "@/components/dashboard/strategy-advisor";
import Ahr999Card from "@/components/dashboard/ahr999-card";
import OnchainCard from "@/components/dashboard/onchain-card";
import StoicCard from "@/components/dashboard/stoic-card";
import MacroLiquidityCard from "@/components/dashboard/macro-liquidity-card";
import TradingDiary from "@/components/dashboard/trading-diary";

interface BacktestResult {
    totalInvested: number;
    totalBTC: number;
    finalValue: number;
    roi: number;
    annualizedReturn: number;
    maxDrawdown: number;
    averageCost: number;
    buys: Array<{
        date: string;
        portfolioValue: number;
        totalInvested: number;
    }>;
}

interface ComparisonResult {
    standard: BacktestResult;
    smart: BacktestResult;
    lumpSum: BacktestResult;
}

export default function DashboardClient() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [backtestResult, setBacktestResult] =
        useState<ComparisonResult | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    if (status === "loading" || !session) {
        return null;
    }

    const handleBacktest = async (params: Record<string, unknown>) => {
        setLoading(true);
        try {
            const res = await fetch("/api/backtest", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(params),
            });

            if (!res.ok) throw new Error("Backtest failed");

            const data = await res.json();
            setBacktestResult(data);
        } catch (err) {
            console.error("Backtest error:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                background:
                    "radial-gradient(ellipse at top left, #1a1020 0%, #0a0a0f 50%)",
            }}
        >
            {/* Header */}
            <header
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "16px 32px",
                    borderBottom: "1px solid var(--border-color)",
                    backdropFilter: "blur(20px)",
                    background: "rgba(10, 10, 15, 0.8)",
                    position: "sticky",
                    top: 0,
                    zIndex: 50,
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background:
                                "linear-gradient(135deg, var(--btc-orange), var(--btc-orange-dark))",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <Bitcoin size={20} color="white" />
                    </div>
                    <div>
                        <h1
                            style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.2 }}
                            className="btc-gradient"
                        >
                            DCA Strategy Agent
                        </h1>
                        <p
                            style={{
                                fontSize: 11,
                                color: "var(--text-muted)",
                            }}
                        >
                            智能定投策略助手
                        </p>
                    </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                        {session.user?.name || session.user?.email}
                    </span>
                    <button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="btn-secondary"
                        style={{ padding: "8px 14px", fontSize: 13 }}
                    >
                        <LogOut size={14} style={{ marginRight: 4, verticalAlign: -2 }} />
                        登出
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main style={{ maxWidth: 1400, margin: "0 auto", padding: "24px 32px" }}>
                {/* Top Section: High Frequency Trading Tools (Chat & Diary) */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 16,
                        marginBottom: 24,
                        alignItems: "stretch",
                    }}
                >
                    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                        <ChatPanel />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                        <TradingDiary />
                    </div>
                </div>

                {/* Secondary Section: Key Stats & Advisor */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 16,
                        marginBottom: 24,
                    }}
                >
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                            <PriceCard />
                            <FGICard />
                        </div>
                        <MacroLiquidityCard />
                        <StrategyAdvisor />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <Ahr999Card />
                        <OnchainCard />
                    </div>
                </div>

                {/* Tertiary Indicators */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 16,
                        marginBottom: 24,
                    }}
                >
                    <StoicCard />
                    <div></div>
                </div>

                {/* Backtest Section */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 16,
                        marginBottom: 24,
                    }}
                >
                    <BacktestForm onSubmit={handleBacktest} loading={loading} />
                    <div></div>
                </div>

                {/* Results */}
                {backtestResult && (
                    <div className="fade-in">
                        <BacktestStats
                            standard={backtestResult.standard}
                            smart={backtestResult.smart}
                            lumpSum={backtestResult.lumpSum}
                        />
                        <div style={{ marginTop: 16 }}>
                            <BacktestChart
                                standardBuys={backtestResult.standard.buys}
                                smartBuys={backtestResult.smart.buys}
                                lumpSumBuys={backtestResult.lumpSum.buys}
                            />
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
