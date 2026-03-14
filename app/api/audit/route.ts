import { generateText } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/prisma";
import { analyzeMacroLiquidity } from "@/lib/engine/macro-advisor";
import { deepseekChatModel } from "@/lib/ai/deepseek";
import { parseJsonFromLLM } from "@/lib/ai/llm-json";
import { ApiError, parseJsonBody, requireUser, withApiHandler } from "@/lib/http/api";

const AUDIT_SYSTEM_PROMPT = `
你是一位秉持斯多葛哲学（Stoicism）的资深比特币投资者和心理教练。
用户的目标是通过理性的定投（DCA）或在极度市场恐慌时逆向买入来积累比特币。
你的任务是对用户的交易记录进行审核（Audit），评估其是否受短期情绪（如 FOMO 追高或 FUD 恐慌抛售）影响。

判断标准：
1. 纪律得分 (1-100)：
   - 90-100: 在极度恐慌 (FGI < 25) 中买入，或在任何时候坚持标准定投。完美的理性克制。
   - 70-89: 正常操作，但在贪婪情绪较高时买入偏多，或者理由不够理性。
   - 40-69: 明显的由于短期价格波动引发的 FOMO 买入，或轻微恐慌导致停止定投。
   - 1-39: 极度恐慌中“割肉（卖出）”，或极度贪婪中 All-in。完全被情绪俘虏。
2. 反馈 (Feedback)：
   用中文回答。使用沉稳、充满哲理的语气。
   - 结合当前的宏观流动性环境（如美联储降息/加息预期），评价用户行为是否顺应了宏观大势，还是在逆势冲动。
   - 肯定其理性的部分，指出被情绪支配的部分。
   - 偶尔引用斯多葛哲学名言（如：马可·奥勒留、塞内加、爱比克泰德）或者 "Amor Fati"。
   - 给出一两句具体的后续建议。
`;

const auditBodySchema = z.object({
    action: z.enum(["BUY", "SELL", "HOLD"]),
    amount: z.number().nullable().optional(),
    price: z.number().nullable().optional(),
    fgi: z.number().nullable().optional(),
    notes: z.string().optional().default(""),
});

const auditResultSchema = z.object({
    score: z.number(),
    feedback: z.string(),
});

export const POST = withApiHandler("audit", async (req: Request) => {
    const user = await requireUser();
    const userId = (user as { id?: string }).id;
    if (!userId) throw new ApiError(500, "Missing user id in session");

    const { action, amount, price, fgi, notes } = await parseJsonBody(
        req,
        auditBodySchema
    );

        // 获取最新的宏观流动性数据
        const macro = await analyzeMacroLiquidity();
        const macroStatus = macro.signal === 'easing' ? '宽松 (利好)' : macro.signal === 'tightening' ? '紧缩 (利空)' : '中性';

        // Call LLM for audit
        const userPrompt = `
新交易条目信息：
- 行为：${action === "BUY" ? "买入" : action === "SELL" ? "卖出" : "观望不操作"}
- 数量：${amount ? amount + " BTC" : "未填写"}
- 价格：${price ? "$" + price : "未填写"}
- 当时市场恐惧贪婪指数 (FGI)：${fgi || "未知"}
- 用户的心理记录与想法：${notes || "未填写"}

当前宏观流动性与群体情绪 (Macro & Retail Sentiment)：
- 整体宏观信号：${macroStatus}
- 美元指数(DXY)：${macro.dxy.value} (日内变动 ${macro.dxy.changePercent}%)
- 10年期美债(US10Y)：${macro.us10y.value}% (日内变动 ${macro.us10y.changePercent}%)
- 暗示联邦基金利率 (ZQF)：${macro.impliedFedRate.value}% (预期变动 ${macro.impliedFedRate.changeBps} 基点)
- Google搜索热度 (散户FOMO指标)：${macro.retailSentiment.value} (${macro.retailSentiment.trend === 'spiking' ? '激增/狂热' : macro.retailSentiment.trend === 'cooling' ? '冷却/无人问津' : '平稳'})
- 宏观引擎总研判逻辑：${macro.reasoning.join(" | ")}

请根据以上用户的微观操作和当前的宏观背景，给出你的斯多葛审计分数和反馈。
`;

        const { text } = await generateText({
            model: deepseekChatModel("deepseek-chat"),
            system: AUDIT_SYSTEM_PROMPT,
            prompt: userPrompt + "\n\n请严格返回以下格式的 JSON 字符串（不要包含额外的文字，用 ```json  ``` 括起来）：\n{\n  \"score\": 85,\n  \"feedback\": \"你的反馈内容\"\n}",
        });

        const parsedAudit = parseJsonFromLLM(text, auditResultSchema);
        const auditResult = parsedAudit ?? {
            score: 50,
            feedback: "Agent 暂时无法提供详细的斯多葛审计，但请继续保持纪律。",
        };

        if (!parsedAudit) {
            console.error("[audit] Failed to parse JSON from LLM:", text);
        }

        // Save to Database
        const entry = await prisma.tradeJournal.create({
            data: {
                userId,
                action,
                amount: amount ?? null,
                price: price ?? null,
                fgi: fgi ?? null,
                notes,
                auditScore: auditResult.score,
                auditFeedback: auditResult.feedback,
            },
        });

    return NextResponse.json(entry, { status: 200 });
});

export const GET = withApiHandler("audit:get", async () => {
    const user = await requireUser();
    const userId = (user as { id?: string }).id;
    if (!userId) throw new ApiError(500, "Missing user id in session");

    const journals = await prisma.tradeJournal.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 20, // Only fetch the latest 20
    });

    return NextResponse.json(journals, { status: 200 });
});
