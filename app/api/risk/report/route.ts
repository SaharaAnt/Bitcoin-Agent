import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/prisma";
import { generateBtcRiskReport, hashRiskReport } from "@/lib/engine/risk-report";
import { ApiError, parseJsonBody, requireUser, withApiHandler } from "@/lib/http/api";

const reportParamsSchema = z.object({
  volatilityWindowDays: z.number().int().min(7).max(120).optional(),
  drawdownLookbackDays: z.number().int().min(90).max(730).optional(),
  smaDays: z.number().int().min(50).max(400).optional(),
});

const postBodySchema = reportParamsSchema.extend({
  force: z.boolean().optional(),
});

function parseNumberParam(value: string | null) {
  if (!value) return undefined;
  const n = Number(value);
  if (!Number.isFinite(n)) return undefined;
  return n;
}

async function getOrGenerateLatestSnapshot(opts: {
  userId: string;
  force?: boolean;
  params?: z.infer<typeof reportParamsSchema>;
}) {
  const { userId, force = false, params } = opts;

  const latest = await prisma.riskReportSnapshot.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  const minAgeMs = 10 * 60 * 1000;
  if (!force && latest && Date.now() - latest.createdAt.getTime() < minAgeMs) {
    return latest;
  }

  const report = await generateBtcRiskReport(params);
  const hash = hashRiskReport(report);

  try {
    return await prisma.riskReportSnapshot.create({
      data: {
        userId,
        asOf: new Date(report.asOf),
        hash,
        params: report.params,
        metrics: report.metrics,
        report,
        confidence: report.confidence,
      },
    });
  } catch (err: any) {
    // Unique constraint on hash: return existing snapshot if concurrently generated.
    if (err?.code === "P2002") {
      const existing = await prisma.riskReportSnapshot.findUnique({ where: { hash } });
      if (existing) return existing;
    }
    throw err;
  }
}

export const GET = withApiHandler("risk/report", async (req) => {
  const user = await requireUser();
  const url = new URL(req.url);
  const fresh = url.searchParams.get("fresh") === "1";

  const paramsParsed = reportParamsSchema.safeParse({
    volatilityWindowDays: parseNumberParam(url.searchParams.get("volatilityWindowDays")),
    drawdownLookbackDays: parseNumberParam(url.searchParams.get("drawdownLookbackDays")),
    smaDays: parseNumberParam(url.searchParams.get("smaDays")),
  });

  const snapshot = await getOrGenerateLatestSnapshot({
    userId: user.id,
    force: fresh,
    params: paramsParsed.success ? paramsParsed.data : undefined,
  });

  return NextResponse.json({ snapshot });
});

export const POST = withApiHandler("risk/report", async (req) => {
  const user = await requireUser();
  const body = await parseJsonBody(req, postBodySchema);

  const { force, ...rawParams } = body;
  const paramsParsed = reportParamsSchema.safeParse(rawParams);
  if (!paramsParsed.success) {
    throw new ApiError(400, "Invalid params", paramsParsed.error.flatten());
  }

  const snapshot = await getOrGenerateLatestSnapshot({
    userId: user.id,
    force: force ?? false,
    params: paramsParsed.data,
  });

  return NextResponse.json({ snapshot });
});

