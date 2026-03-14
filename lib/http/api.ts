import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { auth } from "@/lib/auth";

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export function withApiHandler(
  routeName: string,
  handler: (req: Request) => Promise<Response>
) {
  return async (req: Request) => {
    try {
      return await handler(req);
    } catch (err) {
      if (err instanceof ApiError) {
        return NextResponse.json(
          { error: err.message, details: err.details },
          { status: err.status }
        );
      }

      console.error(`[${routeName}] Error:`, err);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  };
}

export async function requireUser() {
  const session = await auth();
  if (!session?.user) {
    throw new ApiError(401, "Unauthorized");
  }
  return session.user;
}

export function requireCronAuth(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return;

  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    throw new ApiError(401, "Unauthorized");
  }
}

export async function parseJsonBody<TSchema extends z.ZodTypeAny>(
  req: Request,
  schema: TSchema
): Promise<z.infer<TSchema>> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    throw new ApiError(400, "Invalid JSON body");
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    throw new ApiError(400, "Invalid request body", parsed.error.flatten());
  }

  return parsed.data;
}

