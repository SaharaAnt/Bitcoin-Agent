"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

type SparklineProps = {
    data: number[];
    stroke?: string;
    height?: number;
    strokeWidth?: number;
};

export function Sparkline({
    data,
    stroke = "var(--btc-orange)",
    height = 48,
    strokeWidth = 2,
}: SparklineProps) {
    if (!data || data.length === 0) return null;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const points = data
        .map((value, index) => {
            const x = (index / (data.length - 1)) * 100;
            const y = 100 - ((value - min) / range) * 100;
            return `${x},${y}`;
        })
        .join(" ");

    return (
        <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{ width: "100%", height }}
        >
            <polyline
                fill="none"
                stroke={stroke}
                strokeWidth={strokeWidth}
                points={points}
                style={{ opacity: 0.9 }}
            />
        </svg>
    );
}

export type IndicatorCardProps = {
    title: string;
    subtitle?: string;
    value: string;
    valueColor?: string;
    badge?: ReactNode;
    sparklineData?: number[];
    sparklineColor?: string;
    explanation?: string;
    footerItems?: Array<{ label: string; value: string }>;
    rightAction?: ReactNode;
    details?: ReactNode;
    defaultExpanded?: boolean;
};

export default function IndicatorCard({
    title,
    subtitle,
    value,
    valueColor,
    badge,
    sparklineData,
    sparklineColor,
    explanation,
    footerItems,
    rightAction,
    details,
    defaultExpanded = false,
}: IndicatorCardProps) {
    const [expanded, setExpanded] = useState(defaultExpanded);
    const detailsRef = useRef<HTMLDivElement>(null);
    const [detailsHeight, setDetailsHeight] = useState(0);

    useEffect(() => {
        if (!detailsRef.current) return;
        setDetailsHeight(detailsRef.current.scrollHeight);
    }, [details, expanded]);

    return (
        <div className="card" style={{ minHeight: 170, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                    <div style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 600 }}>
                        {title}
                    </div>
                    {subtitle && (
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                            {subtitle}
                        </div>
                    )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {badge}
                    {rightAction}
                    {details && (
                        <button
                            onClick={() => setExpanded((v) => !v)}
                            style={{
                                background: "transparent",
                                color: "var(--text-muted)",
                                border: "1px solid var(--border-color)",
                                padding: "4px 8px",
                                borderRadius: 6,
                                fontSize: 11,
                                cursor: "pointer",
                            }}
                        >
                            {expanded ? "收起" : "展开"}
                        </button>
                    )}
                </div>
            </div>

            <div
                style={{
                    fontSize: 28,
                    fontWeight: 800,
                    marginTop: 10,
                    color: valueColor ?? "var(--text-primary)",
                }}
            >
                {value}
            </div>

            {sparklineData && sparklineData.length > 0 && (
                <div style={{ marginTop: 10, marginBottom: 8 }}>
                    <Sparkline data={sparklineData} stroke={sparklineColor} />
                </div>
            )}

            {explanation && (
                <div
                    style={{
                        fontSize: 12,
                        color: "var(--text-secondary)",
                        lineHeight: 1.6,
                        background: "rgba(255,255,255,0.03)",
                        padding: "8px 10px",
                        borderRadius: 8,
                        marginTop: "auto",
                    }}
                >
                    {explanation}
                </div>
            )}

            {footerItems && footerItems.length > 0 && (
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 8,
                        marginTop: 10,
                    }}
                >
                    {footerItems.map((item) => (
                        <div
                            key={item.label}
                            style={{
                                background: "var(--bg-secondary)",
                                borderRadius: 8,
                                padding: "8px 10px",
                            }}
                        >
                            <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4 }}>
                                {item.label}
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 700 }}>{item.value}</div>
                        </div>
                    ))}
                </div>
            )}

            {details && (
                <div
                    style={{
                        marginTop: 12,
                        overflow: "hidden",
                        maxHeight: expanded ? detailsHeight : 0,
                        opacity: expanded ? 1 : 0,
                        transition: "max-height 0.3s ease, opacity 0.3s ease",
                    }}
                >
                    <div ref={detailsRef}>{details}</div>
                </div>
            )}
        </div>
    );
}
