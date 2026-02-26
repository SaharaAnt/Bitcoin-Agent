import googleTrends from 'google-trends-api';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const results = await googleTrends.interestOverTime({
            keyword: 'Bitcoin',
            startTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        });
        const parsed = JSON.parse(results);
        const data = parsed.default.timelineData.slice(-5);
        return NextResponse.json({ success: true, data });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
