import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const alerts = await prisma.alert.findMany({
            where: { userId: user.id },
            orderBy: [
                { status: "asc" }, // ACTIVE first
                { timestamp: "desc" },
            ],
            take: 50, // Keep it sane for now
        });

        return NextResponse.json(alerts);
    } catch (error) {
        console.error("[GET /api/alerts] Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch alerts" },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { targetPrice, type } = body;

        if (typeof targetPrice !== "number" || targetPrice <= 0) {
            return NextResponse.json({ error: "Invalid target price" }, { status: 400 });
        }

        if (type !== "ABOVE" && type !== "BELOW") {
            return NextResponse.json({ error: "Invalid alert type" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Check if user has too many active alerts to prevent spam
        const activeCount = await prisma.alert.count({
            where: { userId: user.id, status: "ACTIVE" },
        });

        if (activeCount >= 10) {
            return NextResponse.json(
                { error: "Max 10 active alerts allowed at a time." },
                { status: 429 }
            );
        }

        const newAlert = await prisma.alert.create({
            data: {
                userId: user.id,
                targetPrice,
                type,
                status: "ACTIVE",
            },
        });

        return NextResponse.json(newAlert, { status: 201 });
    } catch (error) {
        console.error("[POST /api/alerts] Error:", error);
        return NextResponse.json(
            { error: "Failed to create alert" },
            { status: 500 }
        );
    }
}
