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
import UsdtSentimentCard from "@/components/dashboard/usdt-sentiment-card";
import MacroLiquidityCard from "@/components/dashboard/macro-liquidity-card";
import EtfFlowCard from "@/components/dashboard/etf-flow-card";
import MvrvCard from "@/components/dashboard/mvrv-card";
import ConfidenceCard from "@/components/dashboard/confidence-card";
import PriceAlertCard from "@/components/dashboard/price-alert-card";
import TrendsChart from "@/components/dashboard/trends-chart";
import TradingDiary from "@/components/dashboard/trading-diary";
import RiskBriefCard from "@/components/dashboard/risk-brief-card";
import { MacroAnalysis } from "@/lib/engine/macro-advisor";

interface BacktestResult {
    totalInvested: number;
    totalBTC: number;
    finalValue: number;
    roi: number;
    annualizedReturn: number;
    maxDrawdown: number;
    averageCost: number;
    underwaterDays: number;
    longestDrawdownDays: number;
    winRate: number;
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
    const [macro, setMacro] = useState<MacroAnalysis | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchMacro = async () => {
            try {
                const res = await fetch("/api/macro");
                if (res.ok) {
                    const data = await res.json();
                    setMacro(data);
                }
            } catch (err) {
                console.error("Failed to fetch macro in dashboard:", err);
            }
        };
        fetchMacro();
    }, []);

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
                background: "transparent", // relying on global body background
            }}
        >
            {/* Header */}
            <header
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "16px 32px",
                    borderBottom: "1px solid var(--neon-cyan)",
                    backdropFilter: "blur(20px)",
                    background: "rgba(1, 1, 10, 0.85)",
                    boxShadow: "0 0 20px rgba(0, 243, 255, 0.15)",
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
                            borderRadius: 4,
                            background: "rgba(0, 243, 255, 0.1)",
                            border: "1px solid var(--neon-cyan)",
                            boxShadow: "inset 0 0 10px rgba(0, 243, 255, 0.2), 0 0 15px rgba(0, 243, 255, 0.3)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <Bitcoin size={20} color="var(--neon-cyan)" />
                    </div>
                    <div>
                        <h1
                            style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.2, color: "var(--neon-cyan)", textShadow: "0 0 8px rgba(0, 243, 255, 0.5)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: 1 }}
                        >
                            DCA SYSTEM.CORE
                        </h1>
                        <p
                            style={{
                                fontSize: 11,
                                color: "var(--text-secondary)",
                                fontFamily: "var(--font-mono)",
                                textTransform: "uppercase"
                            }}
                        >
                            Agent Network Active
                        </p>
                    </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <span style={{ fontSize: 13, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                        ID: {session.user?.name || session.user?.email}
                    </span>
                    <button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="btn-secondary"
                        style={{ padding: "8px 14px", fontSize: 13 }}
                    >
                        <LogOut size={14} style={{ marginRight: 4, verticalAlign: -2 }} />
                        DISCONNECT
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main style={{ maxWidth: 1400, margin: "0 auto", padding: "24px 32px" }}>
                {/* HEADS UP DISPLAY / Row 1: Core Pulse Indicators */}
                <h2 style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--neon-cyan)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 2 }}>[ SYSTEM.PULSE ]</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16, marginBottom: 32 }}>
                    <PriceCard />
                    <FGICard />
                    <Ahr999Card />
                    <MvrvCard />
                    <ConfidenceCard />
                </div>

                {/* COMMAND CENTER / Row 2: Verifiable Risk & Strategy Advisor */}
                <h2 style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 2 }}>[ STRATEGY.MATRIX ]</h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16, marginBottom: 32, alignItems: "stretch" }}>
                    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                        <RiskBriefCard />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                        <StrategyAdvisor />
                    </div>
                </div>

                {/* WORKSPACE / Row 3: AI Chat & Trading Diary */}
                <h2 style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--cyber-magenta)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 2 }}>[ NEURAL.LINK_INTERFACE ]</h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32, alignItems: "stretch" }}>
                    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}><ChatPanel /></div>
                    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}><TradingDiary /></div>
                </div>

                {/* DATA FEED / Row 4: Deep Dive Analytics */}
                <h2 style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 2 }}>[ DATA.FEED ]</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32, alignItems: "stretch" }}>
                    <MacroLiquidityCard />
                    <UsdtSentimentCard />
                    <EtfFlowCard />
                    <OnchainCard />
                </div>

                {/* TOOLS & SIMULATION / Row 5: Actionable Tools */}
                <h2 style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 2 }}>[ SIMULATION.TOOLS ]</h2>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 32, alignItems: "stretch" }}>
                    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                        {macro?.retailSentiment?.timeline && (
                            <TrendsChart
                                data={macro.retailSentiment.timeline}
                                reddit={macro.retailSentiment.reddit}
                            />
                        )}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%" }}>
                        <PriceAlertCard />
                        <BacktestForm onSubmit={handleBacktest} loading={loading} />
                    </div>
                </div>

                {/* Results Section for Backtester */}
                {backtestResult && (
                    <div className="fade-in" style={{ marginTop: 24, padding: "24px 0", borderTop: "1px solid var(--neon-cyan)" }}>
                        <h2 style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--neon-cyan)', textShadow: '0 0 8px rgba(0, 243, 255, 0.4)', marginBottom: 24, textTransform: 'uppercase', letterSpacing: 2 }}>[ SIMULATION.RESULTS ]</h2>
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
