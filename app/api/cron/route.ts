import { NextResponse } from "next/server";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { getBtcCurrentPrice, get60DMA } from "@/lib/api/coingecko";
import { getFearGreedCurrent } from "@/lib/api/fear-greed";
import { getNetworkCongestionStatus } from "@/lib/api/mempool";
import { getMockedLiquidations } from "@/lib/api/liquidations";
import { analyzeMarketConditions } from "@/lib/engine/strategy-advisor";
import { calculateAhr999 } from "@/lib/engine/ahr999";
import { analyzeMacroLiquidity } from "@/lib/engine/macro-advisor";
import { prisma } from "@/lib/prisma";
import { sendAlertEmail, simpleMarkdownToHtml } from "@/lib/api/email";

// Ensure Edge runtime is not used if Prisma isn't Edge-compatible in this setup, usually Node is fine for Cron.
export const dynamic = "force-dynamic";
export const maxDuration = 60; // Allow up to 60 seconds on Vercel to prevent timeouts

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
        const [btc, fgi, mempool, strategy, ahr, ma60, macro] = await Promise.all([
            getBtcCurrentPrice(),
            getFearGreedCurrent(),
            getNetworkCongestionStatus(),
            analyzeMarketConditions(),
            calculateAhr999(),
            get60DMA(),
            analyzeMacroLiquidity()
        ]);
        const liquidations = await getMockedLiquidations(fgi.value, btc.change24h);

        // 3. Determine if market is "Extreme"
        // Criteria: FGI <= 25 (Extreme Fear) OR FGI >= 75 (Extreme Greed) OR BTC drops > 5% in 24h
        const isExtreme = fgi.value <= 25 || fgi.value >= 75 || btc.change24h <= -5;

        // 4. Generate AI Analysis with Stoic Persona
        const prompt = `
作为一位秉持斯多葛哲学的资深 Bitcoin HODLer，请根据以下最新市场数据，写一份简短有力的客观评估与建议（约300字）。

【当前数据】
- BTC 当前价格: $${btc.price.toLocaleString()} (24h变动: ${btc.change24h.toFixed(2)}%)
- 宏观流动性雷达: ${macro.signalLabel} (美元指数: ${macro.dxy.value}，10年期美债: ${macro.us10y.value}%)。${macro.reasoning.join('; ')}
- 链上均线(技术面): MA200(长线牛熊): $${ahr.ma200.toLocaleString()}，MA60(中期强弱): $${Math.round(ma60).toLocaleString()}
- Ahr999 囤币指数: ${ahr.value.toFixed(3)} (${ahr.zoneLabel})
- 恐慌贪婪指数 (FGI): ${fgi.value} (${fgi.label})
- 系统策略建议: ${strategy.signalLabel} (依据: ${strategy.suggestion.reasoning.join('; ')})
- 全网期货爆仓: 过去24小时爆仓 ${liquidations.totalLiquidationsUSD} 亿美元（主要爆仓方: ${liquidations.dominantSide}。${liquidations.reasoning}）
- 网络拥堵状况: ${mempool.isCongested ? "极度拥堵" : "畅通"} (${mempool.reasoning})

【要求】
1. 使用 Markdown 格式渲染（可以使用一到两个带 emoji 的标题）。
2. 开头简述市场核心现状，必须先从**宏观流动性（美联储/降息/美债预期）**与**技术面均线（MA200/MA60）**的高度确立大背景。
3. 结合系统各项硬核指标（Ahr999、FGI、以及策略模型建议的${strategy.signalLabel}），直接给出明确的行动建议或纪律要求（定投、减仓或抄底）。
4. 结尾部分务必带入“斯多葛哲学”视角：如区分可控（你的宏观认知和定投纪律）与不可控（短期的恐慌贪婪与波动），视波动为试炼，给予执行者精神反馈。
5. 保持沉稳、克制。分析要像华尔街量化对冲基金经理一样专业，精神要像古罗马斯多葛哲学家一样通透。
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

        // 6. Send Email Always
        let emailSent = false;
        console.log(`[cron] Generating email subject for daily briefing...`);
        let subjectKey = "平稳";
        if (fgi.value <= 25) subjectKey = "极度恐慌";
        else if (fgi.value <= 45) subjectKey = "恐慌";
        else if (fgi.value >= 75) subjectKey = "极度贪婪";
        else if (fgi.value >= 55) subjectKey = "贪婪";

        const subject = `[Stoic Agent] 每日行情简报: ${subjectKey} (BTC $${btc.price.toLocaleString()})`;
        const htmlContent = simpleMarkdownToHtml(content);

        const emailRes = await sendAlertEmail({ subject, html: htmlContent });
        emailSent = emailRes.success;

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
