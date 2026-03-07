export interface UsdtSentiment {
    value: number; // 0-100
    label: "Overheated" | "Bullish" | "Neutral" | "Bearish";
    description: string;
    borrowApy: number;
    avgBorrowApy30d: number;
    signal: "Sell/Short" | "Hold/Long" | "Neutral" | "Accumulate";
}

export function calculateUsdtSentiment(
    currentBorrowApy: number,
    history: { borrowApy: number }[]
): UsdtSentiment {
    const validHistory = history.filter(h => h.borrowApy > 0);
    const avg30d = validHistory.length > 0
        ? validHistory.reduce((acc, curr) => acc + curr.borrowApy, 0) / validHistory.length
        : currentBorrowApy;

    let value = 50;
    let label: UsdtSentiment["label"] = "Neutral";
    let signal: UsdtSentiment["signal"] = "Neutral";
    let description = "USDT borrowing demand is within normal historical ranges.";

    const ratio = currentBorrowApy / (avg30d || 1);

    if (currentBorrowApy > 15 || ratio > 2.5) {
        value = 90;
        label = "Overheated";
        signal = "Sell/Short";
        description = "USDT borrowing rates are extremely high, suggesting excessive leverage and potential market overheating.";
    } else if (currentBorrowApy > 8 || ratio > 1.5) {
        value = 75;
        label = "Bullish";
        signal = "Hold/Long";
        description = "USDT borrowing rates are rising, indicating increasing leverage demand and bullish sentiment.";
    } else if (currentBorrowApy < 2 || ratio < 0.6) {
        value = 25;
        label = "Bearish";
        signal = "Accumulate";
        description = "USDT borrowing rates are low, suggesting low leverage demand or market caution.";
    }

    return {
        value,
        label,
        description,
        borrowApy: currentBorrowApy,
        avgBorrowApy30d: avg30d,
        signal
    };
}
