"use client";

import { useState, useEffect } from "react";
import { BookOpen, AlertCircle, PlusCircle, Frown, Smile, ShieldAlert } from "lucide-react";

interface TradeJournal {
    id: string;
    action: "BUY" | "SELL" | "HOLD";
    amount: number | null;
    price: number | null;
    fgi: number | null;
    notes: string;
    auditScore: number | null;
    auditFeedback: string | null;
    createdAt: string;
}

export default function TradingDiary() {
    const [journals, setJournals] = useState<TradeJournal[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form states
    const [action, setAction] = useState<"BUY" | "SELL" | "HOLD">("HOLD");
    const [amount, setAmount] = useState("");
    const [price, setPrice] = useState("");
    const [fgi, setFgi] = useState("");
    const [notes, setNotes] = useState("");

    useEffect(() => {
        fetchJournals();
    }, []);

    const fetchJournals = async () => {
        try {
            const res = await fetch("/api/audit");
            if (res.ok) {
                const data = await res.json();
                setJournals(data);
            }
        } catch (error) {
            console.error("Failed to fetch journals", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch("/api/audit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action,
                    amount: amount ? Number(amount) : null,
                    price: price ? Number(price) : null,
                    fgi: fgi ? Number(fgi) : null,
                    notes,
                }),
            });

            if (res.ok) {
                const newJournal = await res.json();
                setJournals([newJournal, ...journals]);
                // Reset form
                setNotes("");
                setAmount("");
                setPrice("");
            }
        } catch (error) {
            console.error("Submit error", error);
        } finally {
            setSubmitting(false);
        }
    };

    const getScoreColor = (score: number | null) => {
        if (!score) return "#888";
        if (score >= 90) return "#10b981"; // Excellent
        if (score >= 70) return "#3b82f6"; // Good
        if (score >= 40) return "#f59e0b"; // Warning
        return "#ef4444"; // Bad
    };

    const getScoreIcon = (score: number | null) => {
        if (!score) return <AlertCircle size={16} />;
        if (score >= 90) return <Smile size={16} />;
        if (score >= 70) return <Smile size={16} />;
        if (score >= 40) return <Frown size={16} />;
        return <ShieldAlert size={16} />;
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Input Form */}
            <div className="card" style={{ padding: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                    <BookOpen size={18} />
                    记一笔：斯多葛晚课
                </h3>
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>

                    <div style={{ display: "flex", gap: 12 }}>
                        <select
                            value={action}
                            onChange={(e) => setAction(e.target.value as any)}
                            style={{ padding: "8px 12px", background: "#1a1a2e", border: "1px solid #2a2a3e", borderRadius: 8, color: "white", flex: 1 }}
                        >
                            <option value="BUY">买入 (BUY)</option>
                            <option value="SELL">卖出 (SELL)</option>
                            <option value="HOLD">观望 (HOLD)</option>
                        </select>

                        <input
                            type="number"
                            placeholder="数量 (BTC)"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            step="0.00000001"
                            style={{ padding: "8px 12px", background: "#1a1a2e", border: "1px solid #2a2a3e", borderRadius: 8, color: "white", flex: 1 }}
                        />
                    </div>

                    <div style={{ display: "flex", gap: 12 }}>
                        <input
                            type="number"
                            placeholder="当时 BTC 价格 ($)"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            style={{ padding: "8px 12px", background: "#1a1a2e", border: "1px solid #2a2a3e", borderRadius: 8, color: "white", flex: 1 }}
                        />
                        <input
                            type="number"
                            placeholder="当时恐慌指数 (FGI 1-100)"
                            value={fgi}
                            onChange={(e) => setFgi(e.target.value)}
                            min="1" max="100"
                            style={{ padding: "8px 12px", background: "#1a1a2e", border: "1px solid #2a2a3e", borderRadius: 8, color: "white", flex: 1 }}
                        />
                    </div>

                    <textarea
                        placeholder="当时的真实想法？是 FOMO 还是恐慌？"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        required
                        style={{ padding: "12px", background: "#1a1a2e", border: "1px solid #2a2a3e", borderRadius: 8, color: "white", minHeight: 80, resize: "vertical" }}
                    />

                    <button
                        type="submit"
                        disabled={submitting}
                        style={{
                            padding: "10px",
                            background: "var(--btc-orange)",
                            color: "#fff",
                            border: "none",
                            borderRadius: 8,
                            fontWeight: 600,
                            cursor: submitting ? "not-allowed" : "pointer",
                            opacity: submitting ? 0.7 : 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8
                        }}
                    >
                        {submitting ? "系统正在审计..." : <><PlusCircle size={16} /> 记录日记并获取 Agent 审计</>}
                    </button>
                </form>
            </div>

            {/* Journal History */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <h4 style={{ fontSize: 14, color: "var(--text-secondary)", marginLeft: 4 }}>历史回音</h4>

                {loading ? (
                    <div style={{ color: "#888", fontSize: 13, textAlign: "center", padding: 20 }}>加载中...</div>
                ) : journals.length === 0 ? (
                    <div className="card" style={{ padding: 20, textAlign: "center", color: "#888", fontSize: 13 }}>
                        还没有写过日记，开始你的斯多葛实践吧。
                    </div>
                ) : (
                    journals.map(journal => (
                        <div key={journal.id} className="card" style={{ padding: 16 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, borderBottom: "1px solid #2a2a3e", paddingBottom: 12 }}>
                                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                    <span style={{
                                        padding: "4px 8px",
                                        borderRadius: 4,
                                        fontSize: 11,
                                        fontWeight: 700,
                                        background: journal.action === "BUY" ? "rgba(16, 185, 129, 0.1)" : journal.action === "SELL" ? "rgba(239, 68, 68, 0.1)" : "rgba(136, 136, 160, 0.1)",
                                        color: journal.action === "BUY" ? "#10b981" : journal.action === "SELL" ? "#ef4444" : "#8888a0"
                                    }}>
                                        {journal.action}
                                    </span>
                                    <span style={{ fontSize: 12, color: "#888" }}>
                                        {new Date(journal.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                {journal.auditScore && (
                                    <div style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 6,
                                        color: getScoreColor(journal.auditScore),
                                        fontSize: 13,
                                        fontWeight: 600
                                    }}>
                                        {getScoreIcon(journal.auditScore)}
                                        纪律分: {journal.auditScore}/100
                                    </div>
                                )}
                            </div>

                            <div style={{ fontSize: 14, color: "var(--text)", marginBottom: 12, lineHeight: 1.5 }}>
                                <span style={{ color: "#888", marginRight: 8 }}>你的想法:</span>
                                {journal.notes}
                            </div>

                            {journal.auditFeedback && (
                                <div style={{
                                    padding: 12,
                                    background: "rgba(247, 147, 26, 0.05)",
                                    borderLeft: "3px solid var(--btc-orange)",
                                    borderRadius: "0 8px 8px 0",
                                    fontSize: 13,
                                    color: "var(--text)",
                                    lineHeight: 1.6
                                }}>
                                    <span style={{ color: "var(--btc-orange)", fontWeight: 600, display: "block", marginBottom: 4 }}>
                                        Agent 晚课点评:
                                    </span>
                                    {journal.auditFeedback}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
