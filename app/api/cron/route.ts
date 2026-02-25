import { NextResponse } from "next/server";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { getBtcCurrentPrice } from "@/lib/api/coingecko";
import { getFearGreedCurrent } from "@/lib/api/fear-greed";
import { getNetworkCongestionStatus } from "@/lib/api/mempool";
import { getMockedLiquidations } from "@/lib/api/liquidations";
import { prisma } from "@/lib/prisma";
import { sendAlertEmail, simpleMarkdownToHtml } from "@/lib/api/email";

// Ensure Edge runtime is not used if Prisma isn't Edge-compatible in this setup, usually Node is fine for Cron.
export const dynamic = "force-dynamic";

const deepseek = createOpenAI({
    baseURL: "https://api.deepseek.com",
    apiKey: process.env.DEEPSEEK_API_KEY,
});

export async function GET(req: Request) {
    try {
        // 1. Cron Auth Verification
        const authHeader = req.headers.get("authorization");
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            // return new Response("Unauthorized", { status: 401 }); // Commented out for easier local testing. Enable in prod!
            console.warn("[cron] Warning: Missing or invalid CRON_SECRET");
        }

        console.log("[cron] Starting daily market briefing generation...");

        // 2. Fetch all real-time data
        const [btc, fgi, mempool] = await Promise.all([
            getBtcCurrentPrice(),
            getFearGreedCurrent(),
            getNetworkCongestionStatus(),
        ]);
        const liquidations = await getMockedLiquidations(fgi.value, btc.change24h);

        // 3. Determine if market is "Extreme"
        // Criteria: FGI <= 25 (Extreme Fear) OR FGI >= 75 (Extreme Greed) OR BTC drops > 5% in 24h
        const isExtreme = fgi.value <= 25 || fgi.value >= 75 || btc.change24h <= -5;

        // 4. Generate AI Analysis with Stoic Persona
        const prompt = `
作为一位秉持斯多葛哲学的资深 Bitcoin HODLer，请根据以下最新市场数据，写一份简短有力的客观评估与建议（约300字）。

【当前数据】
- BTC 价格: $${btc.price.toLocaleString()} (24h变动: ${btc.change24h.toFixed(2)}%)
- 恐慌贪婪指数 (FGI): ${fgi.value} (${fgi.label})
- 全网期货爆仓: 过去24小时爆仓 ${liquidations.totalLiquidationsUSD} 亿美元（主要爆仓方: ${liquidations.dominantSide}。${liquidations.reasoning}）
- 网络拥堵状况: ${mempool.isCongested ? "极度拥堵" : "畅通"} (${mempool.reasoning})

【要求】
1. 使用 Markdown 格式渲染（可以使用一到两个带 emoji 的标题）。
2. 开头简述市场现状。
3. 结尾务必结合“斯多葛哲学”（如：区分可控与不可控，视波动为试炼）给予定投执行者精神反馈。
4. 如果当前处于极度恐慌或大幅下跌（极端情况），强调这是历史性的捡筹码机会；如果是极度贪婪，提醒不要FOMO追高。
5. 保持沉稳、克制，不要喊单。格式清晰易读。
`;

        const { text: content } = await generateText({
            model: deepseek.chat("deepseek-chat"),
            prompt,
        });

        // 5. Save to Database
        const briefing = await prisma.dailyBriefing.create({
            data: {
                fgi: fgi.value,
                price: btc.price,
                content,
                isExtreme,
            },
        });

        // 6. Send Email if Extreme Market Conditions
        let emailSent = false;
        if (isExtreme) {
            console.log(`[cron] Extreme conditions detected (FGI: ${fgi.value}, 24h: ${btc.change24h}%). Sending alert email...`);
            const subject = `[Stoic Agent] 市场异动警报: ${btc.change24h > 0 ? '狂热' : '恐慌'} (比特币 $${btc.price.toLocaleString()})`;
            const htmlContent = simpleMarkdownToHtml(content);

            const emailRes = await sendAlertEmail({ subject, html: htmlContent });
            emailSent = emailRes.success;
        }

        return NextResponse.json({
            success: true,
            message: "Cron job executed successfully",
            isExtreme,
            emailSent,
            briefingId: briefing.id,
        });

    } catch (error) {
        console.error("[cron] Error:", error);
        return NextResponse.json(
            { success: false, error: "Cron execution failed", details: String(error) },
            { status: 500 }
        );
    }
}
