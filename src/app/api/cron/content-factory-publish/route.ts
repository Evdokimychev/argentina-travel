import { NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/cron/authorize-cron";
import { logCronResult } from "@/lib/cron/log-cron-result";
import { processPublicationJobs } from "@/lib/content-factory/server";

export const dynamic = "force-dynamic";
const CRON_ROUTE = "/api/cron/content-factory-publish";

async function run(request: Request) {
  const auth = authorizeCronRequest(request);
  if (!auth.ok) return auth.response;
  const ranAt = new Date().toISOString();
  try {
    const result = await processPublicationJobs({ limit: 20 });
    await logCronResult(CRON_ROUTE, {
      ok: true,
      ranAt,
      message: `Обработано публикаций: ${result.succeeded}`,
      statusCode: 200,
      details: result,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    await logCronResult(CRON_ROUTE, {
      ok: false,
      ranAt,
      message: "Очередь контент-завода не обработана",
      statusCode: 500,
      error,
    });
    return NextResponse.json({ error: "Очередь публикаций временно недоступна." }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return run(request);
}

export async function POST(request: Request) {
  return run(request);
}

