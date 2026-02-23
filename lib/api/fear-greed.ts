const FGI_BASE = "https://api.alternative.me/fng";

export interface FearGreedData {
    value: number; // 0-100
    label: string; // "Extreme Fear" | "Fear" | "Neutral" | "Greed" | "Extreme Greed"
    timestamp: number;
    date: string;
}

export async function getFearGreedCurrent(): Promise<FearGreedData> {
    const res = await fetch(`${FGI_BASE}/?limit=1`);
    if (!res.ok) {
        throw new Error(`Fear & Greed API error: ${res.status}`);
    }

    const json = await res.json();
    const d = json.data[0];

    return {
        value: parseInt(d.value),
        label: d.value_classification,
        timestamp: parseInt(d.timestamp) * 1000,
        date: new Date(parseInt(d.timestamp) * 1000).toISOString().split("T")[0],
    };
}

export async function getFearGreedHistory(
    days: number = 365
): Promise<FearGreedData[]> {
    const res = await fetch(`${FGI_BASE}/?limit=${days}&format=json`);
    if (!res.ok) {
        throw new Error(`Fear & Greed API error: ${res.status}`);
    }

    const json = await res.json();

    return json.data.map(
        (d: { value: string; value_classification: string; timestamp: string }) => ({
            value: parseInt(d.value),
            label: d.value_classification,
            timestamp: parseInt(d.timestamp) * 1000,
            date: new Date(parseInt(d.timestamp) * 1000).toISOString().split("T")[0],
        })
    );
}

// Build a date-indexed map for fast lookup during backtesting
export async function getFearGreedMap(
    days: number = 365
): Promise<Map<string, number>> {
    const data = await getFearGreedHistory(days);
    const map = new Map<string, number>();

    for (const d of data) {
        map.set(d.date, d.value);
    }

    return map;
}
