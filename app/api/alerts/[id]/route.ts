import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
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

        const resolvedParams = await params;
        const alertId = resolvedParams.id;

        // Try to update the alert to CANCELLED instead of hard deleting
        // Also ensure the alert belongs to the requesting user
        const result = await prisma.alert.updateMany({
            where: {
                id: alertId,
                userId: user.id,
                status: "ACTIVE",
            },
            data: {
                status: "CANCELLED",
            },
        });

        if (result.count === 0) {
            return NextResponse.json(
                { error: "Alert not found or already cancelled" },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, message: "Alert cancelled" });
    } catch (error) {
        console.error("[DELETE /api/alerts/[id]] Error:", error);
        return NextResponse.json(
            { error: "Failed to cancel alert" },
            { status: 500 }
        );
    }
}
