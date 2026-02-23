export interface HistoricalEvent {
    id: string;
    date: string; // YYYY-MM-DD
    eventName: string;
    btcPriceAtEvent: number;
    fgiAtEvent: number;
    roi1Year?: number; // 365 days later return (percentage)
    roi2Year?: number; // 730 days later
    roiCurrent?: number; // return if held until today
}

/**
 * 斯多葛历史回测：模拟历史上极度恐慌的几次著名大跌。
 * 在实际生产环境中，这应该通过向后查询当时的 BTC 价格和 FGI 结合当前价格计算。
 * 在此演示中我们内置了几个加密历史著名的绝望时刻，并动态计算相比于现价的 ROI。
 */
export async function getStoicHistoricalBacktest(currentBtcPrice: number): Promise<HistoricalEvent[]> {
    const events: HistoricalEvent[] = [
        {
            id: "covid-crash",
            date: "2020-03-12",
            eventName: "312 新冠熔断 (COVID-19 Crash)",
            btcPriceAtEvent: 4970, // 大致关口价
            fgiAtEvent: 8, // 极限恐慌
            roi1Year: 1040, // 第2年牛市起飞
            roi2Year: 680,
        },
        {
            id: "china-ban",
            date: "2021-05-19",
            eventName: "519 算力出清 (China Mining Ban)",
            btcPriceAtEvent: 30000,
            fgiAtEvent: 11,
            roi1Year: -3, // 2022年5月还在熊市早期
            roi2Year: -10, // 2023年小幅回暖
        },
        {
            id: "ftx-collapse",
            date: "2022-11-09",
            eventName: "FTX 雷曼时刻 (FTX Collapse)",
            btcPriceAtEvent: 15700,
            fgiAtEvent: 9,
            roi1Year: 130, // 2023年底复苏
            roi2Year: 380, // 2024年底
        }
    ];

    // 动态计算至今日的 ROI
    return events.map((event) => {
        const roiCurrent = ((currentBtcPrice - event.btcPriceAtEvent) / event.btcPriceAtEvent) * 100;
        return {
            ...event,
            roiCurrent: Math.round(roiCurrent)
        };
    });
}

export function formatROI(roi: number | undefined): string {
    if (roi === undefined) return "N/A";
    const prefix = roi >= 0 ? "+" : "";
    return `${prefix}${roi}%`;
}
