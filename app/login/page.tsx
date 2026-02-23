"use client";

import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Bitcoin, LogIn, UserPlus, Mail, Lock, User } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [form, setForm] = useState({ name: "", email: "", password: "" });

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            if (isLogin) {
                const result = await signIn("credentials", {
                    email: form.email,
                    password: form.password,
                    redirect: false,
                });

                if (result?.error) {
                    setError("邮箱或密码错误");
                } else {
                    router.push("/");
                    router.refresh();
                }
            } else {
                const res = await fetch("/api/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(form),
                });

                const data = await res.json();
                if (!res.ok) {
                    setError(data.error);
                } else {
                    // Auto-login after registration
                    await signIn("credentials", {
                        email: form.email,
                        password: form.password,
                        redirect: false,
                    });
                    router.push("/");
                    router.refresh();
                }
            }
        } catch {
            setError("网络错误，请重试");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px",
                background: "radial-gradient(ellipse at top, #1a1020 0%, #0a0a0f 70%)",
            }}
        >
            <div
                className="card btc-glow fade-in"
                style={{ width: "100%", maxWidth: 420, padding: 40 }}
            >
                {/* Logo */}
                <div style={{ textAlign: "center", marginBottom: 32 }}>
                    <div
                        style={{
                            width: 64,
                            height: 64,
                            borderRadius: "16px",
                            background:
                                "linear-gradient(135deg, var(--btc-orange), var(--btc-orange-dark))",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto 16px",
                        }}
                    >
                        <Bitcoin size={32} color="white" />
                    </div>
                    <h1
                        style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}
                        className="btc-gradient"
                    >
                        DCA Strategy Agent
                    </h1>
                    <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
                        智能定投策略助手
                    </p>
                </div>

                {/* Tabs */}
                <div
                    style={{
                        display: "flex",
                        gap: 4,
                        background: "var(--bg-secondary)",
                        borderRadius: 12,
                        padding: 4,
                        marginBottom: 24,
                    }}
                >
                    <button
                        onClick={() => {
                            setIsLogin(true);
                            setError("");
                        }}
                        style={{
                            flex: 1,
                            padding: "10px 0",
                            borderRadius: 10,
                            border: "none",
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.3s",
                            background: isLogin
                                ? "linear-gradient(135deg, var(--btc-orange), var(--btc-orange-dark))"
                                : "transparent",
                            color: isLogin ? "white" : "var(--text-secondary)",
                        }}
                    >
                        <LogIn size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
                        登录
                    </button>
                    <button
                        onClick={() => {
                            setIsLogin(false);
                            setError("");
                        }}
                        style={{
                            flex: 1,
                            padding: "10px 0",
                            borderRadius: 10,
                            border: "none",
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.3s",
                            background: !isLogin
                                ? "linear-gradient(135deg, var(--btc-orange), var(--btc-orange-dark))"
                                : "transparent",
                            color: !isLogin ? "white" : "var(--text-secondary)",
                        }}
                    >
                        <UserPlus size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
                        注册
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    {!isLogin && (
                        <div style={{ marginBottom: 16 }}>
                            <label className="label">
                                <User
                                    size={12}
                                    style={{ marginRight: 4, verticalAlign: -1 }}
                                />
                                昵称
                            </label>
                            <input
                                className="input"
                                type="text"
                                placeholder="Satoshi"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                            />
                        </div>
                    )}

                    <div style={{ marginBottom: 16 }}>
                        <label className="label">
                            <Mail size={12} style={{ marginRight: 4, verticalAlign: -1 }} />
                            邮箱
                        </label>
                        <input
                            className="input"
                            type="email"
                            placeholder="satoshi@bitcoin.org"
                            required
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                        />
                    </div>

                    <div style={{ marginBottom: 24 }}>
                        <label className="label">
                            <Lock size={12} style={{ marginRight: 4, verticalAlign: -1 }} />
                            密码
                        </label>
                        <input
                            className="input"
                            type="password"
                            placeholder="至少6个字符"
                            required
                            minLength={6}
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                        />
                    </div>

                    {error && (
                        <div
                            style={{
                                background: "rgba(255, 71, 87, 0.1)",
                                border: "1px solid rgba(255, 71, 87, 0.3)",
                                borderRadius: 10,
                                padding: "10px 14px",
                                marginBottom: 16,
                                color: "var(--red)",
                                fontSize: 13,
                            }}
                        >
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading}
                        style={{ width: "100%", justifyContent: "center", padding: 14 }}
                    >
                        {loading ? (
                            <div className="spinner" />
                        ) : isLogin ? (
                            "登录"
                        ) : (
                            "创建账号"
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
