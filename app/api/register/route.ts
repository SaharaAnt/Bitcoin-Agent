import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const { name, email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: "邮箱和密码是必填项" },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: "密码至少需要6个字符" },
                { status: 400 }
            );
        }

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return NextResponse.json({ error: "该邮箱已注册" }, { status: 400 });
        }

        const hashedPassword = await hash(password, 12);

        const user = await prisma.user.create({
            data: {
                name: name || email.split("@")[0],
                email,
                hashedPassword,
            },
        });

        return NextResponse.json(
            { user: { id: user.id, email: user.email, name: user.name } },
            { status: 201 }
        );
    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json({ error: "注册失败，请重试" }, { status: 500 });
    }
}
