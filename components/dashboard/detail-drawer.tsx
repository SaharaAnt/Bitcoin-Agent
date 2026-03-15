"use client";

import { ReactNode, useEffect } from "react";
import { X } from "lucide-react";

type DetailDrawerProps = {
    open: boolean;
    title: string;
    subtitle?: string;
    onClose: () => void;
    children: ReactNode;
};

export default function DetailDrawer({
    open,
    title,
    subtitle,
    onClose,
    children,
}: DetailDrawerProps) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 80,
                background: "rgba(0,0,0,0.5)",
                backdropFilter: "blur(6px)",
            }}
            onClick={onClose}
        >
            <div
                style={{
                    position: "absolute",
                    right: 0,
                    top: 0,
                    height: "100%",
                    width: "min(720px, 96vw)",
                    background: "var(--bg-secondary)",
                    borderLeft: "1px solid var(--border-color)",
                    boxShadow: "0 0 40px rgba(0,0,0,0.4)",
                    transform: "translateX(0)",
                    transition: "transform 0.3s ease",
                    display: "flex",
                    flexDirection: "column",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "18px 20px",
                        borderBottom: "1px solid var(--border-color)",
                    }}
                >
                    <div>
                        <div style={{ fontSize: 16, fontWeight: 800 }}>{title}</div>
                        {subtitle && (
                            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                                {subtitle}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            border: "1px solid var(--border-color)",
                            background: "transparent",
                            color: "var(--text-secondary)",
                            borderRadius: 8,
                            padding: "6px 8px",
                            cursor: "pointer",
                        }}
                    >
                        <X size={14} />
                    </button>
                </div>
                <div style={{ padding: 20, overflowY: "auto" }}>{children}</div>
            </div>
        </div>
    );
}

