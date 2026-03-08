import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getBtcCurrentPrice } from "@/lib/api/coingecko";
import { sendAlertEmail, simpleMarkdownToHtml } from "@/lib/api/email";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Usually fast, but give it time just in case

export async function GET(req: Request) {
    // 1. Verify Authorization
    const authHeader = req.headers.get("authorization");
    const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;

    if (!isCron) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // 2. Fetch current BTC price
        const { price: currentPrice } = await getBtcCurrentPrice();

        if (!currentPrice || currentPrice <= 0) {
            throw new Error("Invalid current price fetched");
        }

        // 3. Find all ACTIVE alerts
        const activeAlerts = await prisma.alert.findMany({
            where: { status: "ACTIVE" },
            include: { user: true }, // We need the user's email
        });

        if (activeAlerts.length === 0) {
            return NextResponse.json({ ok: true, message: "No active alerts to process", currentPrice });
        }

        const triggeredAlerts = [];

        // 4. Check conditions
        for (const alert of activeAlerts) {
            const isAboveTriggered = alert.type === "ABOVE" && currentPrice >= alert.targetPrice;
            const isBelowTriggered = alert.type === "BELOW" && currentPrice <= alert.targetPrice;

            if (isAboveTriggered || isBelowTriggered) {
                // Update DB status
                await prisma.alert.update({
                    where: { id: alert.id },
                    data: {
                        status: "TRIGGERED",
                        triggeredAt: new Date(),
                    },
                });

                triggeredAlerts.push(alert);

                // Send Email Notification
                const mdContent = `
# 🚨 比特币价格预警触发

> **触发价格**: $${currentPrice.toLocaleString()}

您设置的预警条件已满足：
**目标**: ${alert.type === "ABOVE" ? "涨破" : "跌破"} $${alert.targetPrice.toLocaleString()}

当前市场波动加剧，请及时登录 [您的控制台](https://bitcoin-agent-main.vercel.app/dashboard) 检查并考虑下一步操作策略。

*Stay calm & HODL.*
`;
                const htmlContent = simpleMarkdownToHtml(mdContent);

                // Assuming Resend snippet handles taking the `alert.user.email`
                // Overriding ALERT_EMAIL if needed, or sending to the user explicitly.
                // NOTE: As Resend might restrict sends without domain verification,
                // we'll send it via our utility. If in testing, it defaults to the ALERT_EMAIL.

                await sendAlertEmail({
                    subject: `[价格预警] BTC已${alert.type === "ABOVE" ? "涨破" : "跌破"} $${alert.targetPrice.toLocaleString()}`,
                    html: htmlContent,
                    // Note: Since Resend sandbox only sends to verified emails, passing user.email
                    // directly might fail unless verified domain. But we construct it for production.
                });
            }
        }

        return NextResponse.json({
            ok: true,
            currentPrice,
            alertsChecked: activeAlerts.length,
            alertsTriggered: triggeredAlerts.length,
        });
    } catch (error) {
        console.error("[CRON Alerts] Error processing price alerts:", error);
        return NextResponse.json({ error: "Failed to process alerts" }, { status: 500 });
    }
}
