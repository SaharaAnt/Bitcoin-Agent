"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, ShieldAlert, X, HeartCrack, CheckCircle2 } from "lucide-react";

interface PanicSellModalProps {
    isOpen: boolean;
    onClose: () => void;
    fgiValue: number;
    currentPrice: number;
}

export default function PanicSellModal({ isOpen, onClose, fgiValue, currentPrice }: PanicSellModalProps) {
    const [step, setStep] = useState(1);
    const [isSelling, setIsSelling] = useState(false);
    const [isSold, setIsSold] = useState(false);

    // Reset state when opened
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setIsSelling(false);
            setIsSold(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const isPanic = fgiValue <= 35; // Define panic threshold

    const handleNext = () => setStep(step + 1);

    const handleForcedWait = () => {
        // Stoic pause
        setIsSelling(true);
        setTimeout(() => {
            setIsSelling(false);
            setStep(step + 1);
        }, 3000); // Demo: 3 seconds friction
    };

    const confirmSell = () => {
        setIsSelling(true);
        setTimeout(() => {
            setIsSelling(false);
            setIsSold(true);
        }, 1500);
    };

    // Render logic based on market condition
    if (!isPanic) {
        return (
            <div className="modal-overlay">
                <div className="modal-content">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                        <h2 style={{ fontSize: 18, margin: 0 }}>确认卖出资产</h2>
                        <button onClick={onClose} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
                            <X size={20} />
                        </button>
                    </div>
                    {isSold ? (
                        <div style={{ textAlign: "center", padding: "32px 0" }}>
                            <CheckCircle2 size={48} color="var(--fear-green)" style={{ marginBottom: 16 }} />
                            <h3>卖出成功</h3>
                            <p style={{ color: "var(--text-muted)", fontSize: 14 }}>已按市场价执行卖出指令。</p>
                        </div>
                    ) : (
                        <>
                            <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>当前市场情绪平稳 (FGI: {fgiValue})，确认要卖出您的资产吗？</p>
                            <div style={{ marginTop: 24, display: "flex", gap: 12, justifyContent: "flex-end" }}>
                                <button className="btn-secondary" onClick={onClose}>取消</button>
                                <button
                                    onClick={confirmSell}
                                    style={{ background: "var(--red)", color: "white", padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer" }}
                                    disabled={isSelling}
                                >
                                    {isSelling ? "执行中..." : "确认卖出"}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    }

    // Panic Sell Friction Mode
    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ border: "1px solid rgba(255, 69, 58, 0.3)", boxShadow: "0 0 40px rgba(255, 69, 58, 0.1)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <ShieldAlert size={20} color="var(--red)" />
                        <h2 style={{ fontSize: 18, margin: 0, color: "var(--red)" }}>斯多葛风控拦截 (Panic Sell Friction)</h2>
                    </div>
                    <button onClick={onClose} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
                        <X size={20} />
                    </button>
                </div>

                {isSold ? (
                    <div style={{ textAlign: "center", padding: "32px 0" }}>
                        <HeartCrack size={48} color="var(--red)" style={{ marginBottom: 16 }} />
                        <h3 style={{ color: "var(--red)" }}>割肉卖出成功</h3>
                        <p style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.6 }}>
                            您已在极度恐慌中以 ${currentPrice.toLocaleString()} 的价格清仓。<br />
                            希望这不是一个让您后悔的决定。
                        </p>
                    </div>
                ) : step === 1 ? (
                    <div className="fade-in">
                        <div style={{ background: "rgba(255, 69, 58, 0.1)", padding: 16, borderRadius: 8, marginBottom: 20 }}>
                            <h4 style={{ color: "var(--red)", display: "flex", alignItems: "center", gap: 8, marginTop: 0, marginBottom: 8 }}>
                                <AlertTriangle size={16} /> 警告：您正试图在恐慌抛售
                            </h4>
                            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
                                当前市场恐慌贪婪指数(FGI)低至 <strong>{fgiValue} (极度恐慌)</strong>。历史数据显示，在此时选择抛售（“割肉”），往往卖在了周期底部。大跌是常态，恐惧是人性的弱点。
                            </p>
                        </div>
                        <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 24 }}>您确定不再坚持您的长期定投策略了吗？</p>

                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <button
                                onClick={onClose}
                                style={{ background: "var(--primary)", color: "white", padding: "12px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 14 }}
                            >
                                我冷静一下，不卖了 (推荐)
                            </button>
                            <button
                                onClick={handleNext}
                                style={{ background: "transparent", color: "var(--text-muted)", padding: "12px", borderRadius: 8, border: "1px solid var(--border-color)", cursor: "pointer", fontSize: 13 }}
                            >
                                我意已决，继续卖出
                            </button>
                        </div>
                    </div>
                ) : step === 2 ? (
                    <div className="fade-in">
                        <h3 style={{ marginBottom: 12 }}>斯多葛灵魂拷问：</h3>
                        <div style={{ background: "var(--bg-secondary)", padding: 16, borderRadius: 8, marginBottom: 20, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                            <p style={{ margin: "0 0 12px 0" }}>1. 导致大跌的原因，是基本面发生了根本性毁坏，还是仅仅是市场情绪的波动？</p>
                            <p style={{ margin: "0 0 12px 0" }}>2. 这笔资金是您未来几个月急需的救命钱吗？</p>
                            <p style={{ margin: 0 }}>3. 回想买入时的初心，现在抛售，是否是因为无法承受暂时的账面浮亏？</p>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <button
                                onClick={handleForcedWait}
                                disabled={isSelling}
                                style={{
                                    background: isSelling ? "var(--bg-secondary)" : "transparent",
                                    color: "var(--red)",
                                    padding: "12px",
                                    borderRadius: 8,
                                    border: "1px solid var(--red)",
                                    cursor: isSelling ? "not-allowed" : "pointer",
                                    fontSize: 13
                                }}
                            >
                                {isSelling ? "强制冷静倒计时中..." : "我已想清楚，执意卖出"}
                            </button>
                            <button
                                onClick={onClose}
                                disabled={isSelling}
                                style={{ background: "var(--bg-secondary)", color: "var(--text-primary)", padding: "12px", borderRadius: 8, border: "none", cursor: isSelling ? "not-allowed" : "pointer", fontSize: 13 }}
                            >
                                取消操作
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="fade-in">
                        <h3 style={{ color: "var(--red)", marginBottom: 12 }}>最后确认</h3>
                        <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 24, lineHeight: 1.6 }}>
                            执行卖出后将无法撤销，您将失去筹码和未来的潜在收益。
                        </p>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
                            <button style={{ flex: 1 }} className="btn-secondary" onClick={onClose} disabled={isSelling}>
                                放弃卖出
                            </button>
                            <button
                                style={{ flex: 1, background: "var(--red)", color: "white", padding: "10px", borderRadius: 8, border: "none", cursor: isSelling ? "not-allowed" : "pointer", fontWeight: 600 }}
                                onClick={confirmSell}
                                disabled={isSelling}
                            >
                                {isSelling ? "正在抛售..." : "全仓卖出"}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.7);
                    backdrop-filter: blur(8px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    padding: 20px;
                }
                .modal-content {
                    background: var(--bg-primary);
                    border: 1px solid var(--border-color);
                    border-radius: 16px;
                    width: 100%;
                    max-width: 440px;
                    padding: 24px;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
                }
                .fade-in {
                    animation: fadeIn 0.3s ease-in-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
