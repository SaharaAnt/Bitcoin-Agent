import { DipConfig, DipAction } from "./types";

export function calculateBuyTheDip(config: DipConfig): DipAction {
    const {
        availableFiat,
        baseAmount,
        currentFgi,
        currentPrice,
        extremeFearThreshold = 20,
        fearThreshold = 40,
    } = config;

    const reasoning: string[] = [];
    let action: DipAction["action"] = "HOLD";
    let recommendedAmount = 0;
    let riskLevel: DipAction["riskLevel"] = "medium";

    // 1. 安全检查，如果没有法币储备
    if (availableFiat <= 0) {
        reasoning.push("可用法币(Stablecoin)不足，当前无法执行额外的加仓计划。");
        return {
            action: "HOLD",
            recommendedAmount: 0,
            reasoning,
            riskLevel: "medium",
        };
    }

    // 2. 根据 FGI 恐慌程度计算阶梯式加仓
    if (currentFgi <= extremeFearThreshold) {
        action = "BUY";
        riskLevel = "extreme";
        // 极度恐慌：可以大比例投入，比如基础份额的 3-5 倍，或可用法币的 30%
        const targetAmountByBase = baseAmount * 5;
        const targetAmountByFiat = availableFiat * 0.3; // 取最大可容忍的30%可用资金
        recommendedAmount = Math.min(targetAmountByBase, targetAmountByFiat);

        reasoning.push(`当前恐慌贪婪指数(FGI)为 ${currentFgi}，进入【极度恐慌】区间 (<= ${extremeFearThreshold})。`);
        reasoning.push(`触发阶梯式加仓信号：建议倍数为 5x Base，即买入 $${recommendedAmount.toFixed(2)}。`);
        reasoning.push(`已扫描可用流动性：当前储蓄使用比例约为 ${(recommendedAmount / availableFiat * 100).toFixed(1)}%。`);

    } else if (currentFgi <= fearThreshold) {
        action = "BUY";
        riskLevel = "high";
        // 一般恐慌：2 倍的基础份额，或者 可用法币的 10%
        const targetAmountByBase = baseAmount * 2;
        const targetAmountByFiat = availableFiat * 0.1;
        recommendedAmount = Math.min(targetAmountByBase, targetAmountByFiat);

        reasoning.push(`当前恐慌贪婪指数为 ${currentFgi}，进入【恐慌】区间 (<= ${fearThreshold})。`);
        reasoning.push(`触发温和加仓信号：建议倍数为 2x Base，即买入 $${recommendedAmount.toFixed(2)}。`);

    } else if (currentFgi >= 75) {
        action = "ACCUMULATE_FIAT";
        riskLevel = "low";
        reasoning.push(`当前 FGI 为 ${currentFgi}，市场处于【极度贪婪】。`);
        reasoning.push("建议暂停买入，积攒法币弹药，等待下一次回调。");
    } else {
        action = "HOLD"; // 或者维持普通的 DCA
        riskLevel = "medium";
        recommendedAmount = baseAmount; // 默认 DCA 金额
        reasoning.push(`FGI 为 ${currentFgi}，市场情绪中性。`);
        reasoning.push(`建议维持常规的定投计划 ($${baseAmount})。`);
    }

    // 3. 收尾检查：建议购买量不会超过可用余额
    if (recommendedAmount > availableFiat) {
        recommendedAmount = availableFiat;
    }

    // 规避太小的零碎购买
    if (action === "BUY" && recommendedAmount < 10) {
        reasoning.push("计算得出建议买入金额较小，为节省手续费建议暂时观望。");
        action = "HOLD";
        recommendedAmount = 0;
    }

    return {
        action,
        recommendedAmount,
        reasoning,
        riskLevel,
    };
}
