"use client";

import { useChat } from "@ai-sdk/react";
import { useState, useRef, useEffect, FormEvent } from "react";
import { Send, Bot, User, Sparkles, Wrench, CheckCircle, Loader } from "lucide-react";

// Tool name → 中文标签 + emoji
const TOOL_LABELS: Record<string, { label: string; icon: string }> = {
    getFearGreedIndex: { label: "恐惧贪婪指数", icon: "📊" },
    getAhr999: { label: "Ahr999 估值", icon: "📐" },
    analyzeMarket: { label: "市场综合分析", icon: "🧠" },
    getBtcPrice: { label: "BTC 实时价格", icon: "₿" },
    getOnchainData: { label: "链上数据", icon: "⛓️" },
    runDCABacktest: { label: "DCA 回测", icon: "📈" },
    runSmartDCABacktest: { label: "智能 DCA 回测", icon: "🤖" },
    compareStrategies: { label: "策略对比", icon: "⚖️" },
};

function ToolCallBadge({ toolName, state }: { toolName: string; state: "call" | "result" }) {
    const info = TOOL_LABELS[toolName] ?? { label: toolName, icon: "🔧" };
    return (
        <div
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 10px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 500,
                background: state === "result"
                    ? "rgba(34, 197, 94, 0.1)"
                    : "rgba(251, 146, 60, 0.1)",
                border: `1px solid ${state === "result" ? "rgba(34, 197, 94, 0.3)" : "rgba(251, 146, 60, 0.3)"}`,
                color: state === "result" ? "#22c55e" : "#fb923c",
            }}
        >
            <span>{info.icon}</span>
            <span>{info.label}</span>
            {state === "result" ? (
                <CheckCircle size={11} />
            ) : (
                <Loader size={11} style={{ animation: "spin 1s linear infinite" }} />
            )}
        </div>
    );
}

export default function ChatPanel() {
    const { messages, sendMessage, status, error } = useChat({
        onError: (err) => {
            console.error("[chat-panel] Error:", err);
        },
    });
    const [input, setInput] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);
    const isLoading = status === "streaming" || status === "submitted";

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;
        sendMessage({ text: input });
        setInput("");
    };

    // 提取消息中所有 tool-invocation parts（已调用 + 已返回结果）
    const getToolParts = (msg: (typeof messages)[number]) => {
        if (!msg.parts) return [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (msg.parts as any[]).filter((p: any) => p.type === "tool-invocation");
    };

    // 提取文本
    const getMessageText = (msg: (typeof messages)[number]) => {
        if (!msg.parts) return "";
        return msg.parts
            .filter((p): p is { type: "text"; text: string } => p.type === "text")
            .map((p) => p.text)
            .join("");
    };

    return (
        <div
            className="card"
            style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 560 }}
        >
            <h3
                style={{
                    fontSize: 16,
                    fontWeight: 700,
                    marginBottom: 16,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                }}
            >
                <Sparkles size={18} color="var(--btc-orange)" />
                AI 定投顾问
                <span
                    style={{
                        marginLeft: "auto",
                        fontSize: 11,
                        fontWeight: 400,
                        color: "var(--text-muted)",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                    }}
                >
                    <Wrench size={11} />
                    8 工具可用
                </span>
            </h3>

            {/* Messages */}
            <div
                ref={scrollRef}
                style={{
                    flex: 1,
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    padding: "8px 0",
                    marginBottom: 12,
                }}
            >
                {messages.length === 0 && (
                    <div
                        style={{
                            textAlign: "center",
                            padding: "40px 20px",
                            color: "var(--text-muted)",
                        }}
                    >
                        <Bot
                            size={40}
                            style={{ margin: "0 auto 12px", display: "block" }}
                            color="var(--btc-orange)"
                        />
                        <p style={{ fontSize: 14, marginBottom: 12 }}>
                            我是你的 Bitcoin DCA 策略顾问
                        </p>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 8,
                                maxWidth: 300,
                                margin: "0 auto",
                            }}
                        >
                            {[
                                "现在能买吗？帮我分析一下",
                                "帮我对比 2020-2024 每周定投 $100 的收益",
                                "市场链上数据怎么样？",
                            ].map((suggestion) => (
                                <button
                                    key={suggestion}
                                    onClick={() => setInput(suggestion)}
                                    style={{
                                        background: "var(--bg-secondary)",
                                        border: "1px solid var(--border-color)",
                                        borderRadius: 10,
                                        padding: "8px 12px",
                                        color: "var(--text-secondary)",
                                        fontSize: 13,
                                        cursor: "pointer",
                                        textAlign: "left",
                                        transition: "all 0.2s",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = "var(--btc-orange)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = "var(--border-color)";
                                    }}
                                >
                                    💬 {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((msg) => {
                    const toolParts = getToolParts(msg);
                    const text = getMessageText(msg);

                    return (
                        <div key={msg.id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {/* Tool Call Badges（只在 assistant 消息中显示）*/}
                            {msg.role === "assistant" && toolParts.length > 0 && (
                                <div
                                    style={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                        gap: 6,
                                        paddingLeft: 38,
                                    }}
                                >
                                    {toolParts.map((part, i) => (
                                        <ToolCallBadge
                                            key={i}
                                            toolName={part.toolInvocation.toolName}
                                            state={part.toolInvocation.state === "result" ? "result" : "call"}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* 消息气泡（只有有文本时才渲染）*/}
                            {text && (
                                <div
                                    style={{
                                        display: "flex",
                                        gap: 10,
                                        flexDirection: msg.role === "user" ? "row-reverse" : "row",
                                        alignItems: "flex-start",
                                    }}
                                >
                                    <div
                                        style={{
                                            width: 28,
                                            height: 28,
                                            borderRadius: 8,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            flexShrink: 0,
                                            background:
                                                msg.role === "user"
                                                    ? "linear-gradient(135deg, var(--btc-orange), var(--btc-orange-dark))"
                                                    : "var(--bg-secondary)",
                                            border:
                                                msg.role === "assistant"
                                                    ? "1px solid var(--border-color)"
                                                    : "none",
                                        }}
                                    >
                                        {msg.role === "user" ? (
                                            <User size={14} color="white" />
                                        ) : (
                                            <Bot size={14} color="var(--btc-orange)" />
                                        )}
                                    </div>

                                    <div
                                        style={{
                                            maxWidth: "80%",
                                            padding: "10px 14px",
                                            borderRadius: 14,
                                            fontSize: 14,
                                            lineHeight: 1.7,
                                            whiteSpace: "pre-wrap",
                                            background:
                                                msg.role === "user"
                                                    ? "linear-gradient(135deg, var(--btc-orange), var(--btc-orange-dark))"
                                                    : "var(--bg-secondary)",
                                            color:
                                                msg.role === "user" ? "white" : "var(--text-primary)",
                                            border:
                                                msg.role === "assistant"
                                                    ? "1px solid var(--border-color)"
                                                    : "none",
                                            borderBottomRightRadius: msg.role === "user" ? 4 : 14,
                                            borderBottomLeftRadius: msg.role === "assistant" ? 4 : 14,
                                        }}
                                    >
                                        {text}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}

                {isLoading && (
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <div
                            style={{
                                width: 28,
                                height: 28,
                                borderRadius: 8,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: "var(--bg-secondary)",
                                border: "1px solid var(--border-color)",
                            }}
                        >
                            <Bot size={14} color="var(--btc-orange)" />
                        </div>
                        <div
                            style={{
                                padding: "10px 14px",
                                borderRadius: 14,
                                background: "var(--bg-secondary)",
                                border: "1px solid var(--border-color)",
                            }}
                        >
                            <div className="spinner" />
                        </div>
                    </div>
                )}

                {error && (
                    <div
                        style={{
                            padding: "10px 14px",
                            borderRadius: 10,
                            background: "rgba(239, 68, 68, 0.1)",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                            color: "#ef4444",
                            fontSize: 13,
                        }}
                    >
                        ⚠️ 出错了: {error.message}
                    </div>
                )}
            </div>

            {/* Input */}
            <form
                onSubmit={handleSubmit}
                style={{
                    display: "flex",
                    gap: 8,
                    borderTop: "1px solid var(--border-color)",
                    paddingTop: 12,
                }}
            >
                <input
                    className="input"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="问我任何关于 DCA 策略的问题..."
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    className="btn-primary"
                    disabled={isLoading || !input.trim()}
                    style={{ padding: "12px 16px", flexShrink: 0 }}
                >
                    <Send size={16} />
                </button>
            </form>

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
