"use client";

import { useState, useEffect } from "react";
import { Bell, BellRing, BellOff, X, ArrowUpRight, ArrowDownRight, Loader2, Trash2, CheckCircle2 } from "lucide-react";

interface Alert {
    id: string;
    targetPrice: number;
    type: "ABOVE" | "BELOW";
    status: "ACTIVE" | "TRIGGERED" | "CANCELLED";
    timestamp: string;
    triggeredAt?: string;
}

export default function PriceAlertCard({ currentBtcPrice }: { currentBtcPrice: number }) {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [targetPriceStr, setTargetPriceStr] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    // Fetch existing alerts
    const fetchAlerts = async () => {
        try {
            const res = await fetch("/api/alerts");
            if (res.ok) {
                const data = await res.json();
                setAlerts(data);
            }
        } catch (e) {
            console.error("Failed to fetch alerts:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAlerts();
    }, []);

    // Form handlers
    const handleSetAlert = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg("");

        const price = parseFloat(targetPriceStr);
        if (isNaN(price) || price <= 0) {
            setErrorMsg("请输入有效的价格");
            return;
        }

        if (!currentBtcPrice) {
            setErrorMsg("未能获取当前价格，暂无法设置预警");
            return;
        }

        const distance = Math.abs(price - currentBtcPrice) / currentBtcPrice;
        if (distance < 0.005) {
            setErrorMsg("目标价离当前价太近 (< 0.5%)");
            return;
        }

        setSubmitting(true);
        const type = price > currentBtcPrice ? "ABOVE" : "BELOW";

        try {
            const res = await fetch("/api/alerts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ targetPrice: price, type }),
            });

            if (res.ok) {
                setTargetPriceStr("");
                fetchAlerts(); // Refresh list
            } else {
                const err = await res.json();
                setErrorMsg(err.error || "创建预警失败");
            }
        } catch (e) {
            setErrorMsg("网络请求出错");
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancelAlert = async (id: string) => {
        // Optimistic UI update
        setAlerts((prev) => prev.filter((a) => a.id !== id));
        fetchAlerts(); // Re-sync

        try {
            await fetch(`/api/alerts/${id}`, { method: "DELETE" });
        } catch (e) {
            console.error(e);
            fetchAlerts(); // Rollback on failure
        }
    };

    const applyQuickTarget = (percent: number) => {
        if (!currentBtcPrice) return;
        const target = currentBtcPrice * (1 + percent / 100);
        setTargetPriceStr(Math.round(target).toString());
        setErrorMsg("");
    };

    const activeCount = alerts.filter(a => a.status === "ACTIVE").length;

    return (
        <div className="card" style={{ display: "flex", flexDirection: "column" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ background: "var(--blue)", padding: 6, borderRadius: 8 }}>
                        <Bell size={18} color="white" />
                    </div>
                    <div>
                        <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>价格预警</h3>
                        <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "2px 0 0 0" }}>
                            触发通知并邮件提醒
                        </p>
                    </div>
                </div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", background: "var(--bg-secondary)", padding: "4px 8px", borderRadius: 12 }}>
                    活跃: {activeCount}
                </div>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSetAlert} style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                    <div style={{ position: "relative", flex: 1 }}>
                        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontWeight: 600 }}>$</span>
                        <input
                            type="number"
                            placeholder={currentBtcPrice ? `当前参考: $${currentBtcPrice.toLocaleString()}` : "目标价格"}
                            value={targetPriceStr}
                            onChange={(e) => setTargetPriceStr(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "12px 12px 12px 28px",
                                borderRadius: 8,
                                border: "1px solid var(--border)",
                                background: "var(--bg-secondary)",
                                color: "var(--text-primary)",
                                outline: "none",
                                fontSize: 15,
                                fontWeight: 500
                            }}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={submitting || !targetPriceStr}
                        style={{
                            background: targetPriceStr && !submitting ? "var(--text-primary)" : "var(--border)",
                            color: targetPriceStr && !submitting ? "var(--bg-primary)" : "var(--text-muted)",
                            border: "none",
                            borderRadius: 8,
                            padding: "0 20px",
                            fontWeight: 600,
                            cursor: targetPriceStr && !submitting ? "pointer" : "not-allowed",
                            transition: "all 0.2s"
                        }}
                    >
                        {submitting ? <Loader2 size={18} className="spin" /> : "设定"}
                    </button>
                </div>

                {errorMsg && (
                    <div style={{ fontSize: 13, color: "var(--red)", marginBottom: 12 }}>
                        {errorMsg}
                    </div>
                )}

                {/* Quick Shortcuts */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {[
                        { label: "-20%", val: -20, c: "var(--red)" },
                        { label: "-10%", val: -10, c: "var(--red)" },
                        { label: "-5%", val: -5, c: "var(--red)" },
                        { label: "+5%", val: 5, c: "var(--green)" },
                        { label: "+10%", val: 10, c: "var(--green)" },
                        { label: "+20%", val: 20, c: "var(--green)" },
                    ].map((btn) => (
                        <button
                            key={btn.label}
                            type="button"
                            onClick={() => applyQuickTarget(btn.val)}
                            style={{
                                fontSize: 12,
                                fontWeight: 600,
                                background: "var(--bg-secondary)",
                                border: "1px solid var(--border)",
                                color: btn.c,
                                padding: "4px 8px",
                                borderRadius: 6,
                                cursor: "pointer",
                            }}
                        >
                            {btn.label}
                        </button>
                    ))}
                </div>
            </form>

            {/* List */}
            <div style={{ flex: 1, overflowY: "auto", minHeight: 150, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
                <h4 style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 12px 0", fontWeight: 600 }}>预警列表</h4>

                {loading ? (
                    <div style={{ display: "flex", justifyContent: "center", padding: 20 }}>
                        <Loader2 size={24} color="var(--text-muted)" className="spin" />
                    </div>
                ) : alerts.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "30px 0", color: "var(--text-secondary)", fontSize: 13 }}>
                        <BellOff size={24} style={{ opacity: 0.5, marginBottom: 8 }} />
                        <div>暂无活跃的预警</div>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {alerts.map((alert) => {
                            const isAbove = alert.type === "ABOVE";
                            const Icon = isAbove ? ArrowUpRight : ArrowDownRight;
                            const color = isAbove ? "var(--green)" : "var(--red)";
                            const isTriggered = alert.status === "TRIGGERED";

                            return (
                                <div key={alert.id} style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    background: isTriggered ? "var(--bg-secondary)" : `${color}11`,
                                    borderLeft: `3px solid ${isTriggered ? "var(--text-muted)" : color}`,
                                    padding: "10px 12px",
                                    borderRadius: "0 8px 8px 0",
                                    opacity: isTriggered ? 0.7 : 1
                                }}>
                                    <div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                                            {!isTriggered && <Icon size={14} color={color} />}
                                            {isTriggered && <CheckCircle2 size={14} color="var(--text-muted)" />}
                                            <span style={{ fontSize: 14, fontWeight: 700, color: isTriggered ? "var(--text-secondary)" : "var(--text-primary)" }}>
                                                {isAbove ? "涨破" : "跌破"} ${alert.targetPrice.toLocaleString()}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                                            {isTriggered
                                                ? `已触发: ${new Date(alert.triggeredAt || "").toLocaleString()}`
                                                : `创建于: ${new Date(alert.timestamp).toLocaleDateString()}`
                                            }
                                        </div>
                                    </div>

                                    {alert.status === "ACTIVE" && (
                                        <button
                                            onClick={() => handleCancelAlert(alert.id)}
                                            style={{
                                                background: "transparent",
                                                border: "none",
                                                color: "var(--text-muted)",
                                                cursor: "pointer",
                                                padding: 6,
                                                borderRadius: 4,
                                            }}
                                            title="取消预警"
                                            className="hover-bg-error"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
