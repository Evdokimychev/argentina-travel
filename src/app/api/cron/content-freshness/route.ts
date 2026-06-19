import { NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/cron/authorize-cron";
import { logCronResult } from "@/lib/cron/log-cron-result";
import { listContentFreshnessItems } from "@/lib/content-freshness-server";
import { sendContentFreshnessReportEmail } from "@/lib/notifications/email-delivery";
import { writeCronRunStatus } from "@/lib/ops/ops-status";

export const dynamic = "force-dynamic";
const CRON_ROUTE = "/api/cron/content-freshness";

function parseRecipientList(rawValue: string | undefined): string[] {
  return (rawValue ?? "")
    .split(/[,\s;]+/)
    .map((email) => email.trim())
    .filter(Boolean);
}

async function runContentFreshnessCron(request: Request): Promise<NextResponse> {
  const ranAt = new Date().toISOString();

  try {
    const staleItems = await listContentFreshnessItems({
      staleOnly: true,
      seedMissing: true,
    });

    if (staleItems.length === 0) {
      const message = "Просроченных материалов не найдено";
      writeCronRunStatus("contentFreshness", {
        ranAt,
        ok: true,
        message,
        details: { staleCount: 0, sent: false },
      });
      await logCronResult(CRON_ROUTE, {
        ok: true,
        ranAt,
        message,
        statusCode: 200,
        details: { staleCount: 0, sent: false },
      });
      return NextResponse.json({ ok: true, staleCount: 0, sent: false, message });
    }

    if (!process.env.RESEND_API_KEY?.trim()) {
      const message = "RESEND_API_KEY не задан — email-уведомление пропущено";
      writeCronRunStatus("contentFreshness", {
        ranAt,
        ok: true,
        message,
        details: { staleCount: staleItems.length, sent: false, skipped: true },
      });
      await logCronResult(CRON_ROUTE, {
        ok: true,
        ranAt,
        message,
        statusCode: 200,
        details: { staleCount: staleItems.length, sent: false, skipped: true },
      });
      return NextResponse.json({
        ok: true,
        staleCount: staleItems.length,
        sent: false,
        skipped: true,
        message,
      });
    }

    const recipients = parseRecipientList(
      process.env.CONTENT_FRESHNESS_NOTIFY_EMAILS?.trim() || process.env.LEADS_NOTIFY_EMAIL?.trim()
    );
    if (!recipients.length) {
      const message = "Нет email-получателей для отчёта актуальности";
      writeCronRunStatus("contentFreshness", {
        ranAt,
        ok: false,
        message,
        details: { staleCount: staleItems.length, sent: false },
      });
      await logCronResult(CRON_ROUTE, {
        ok: false,
        ranAt,
        message,
        statusCode: 500,
        details: { staleCount: staleItems.length, sent: false },
      });
      return NextResponse.json({ ok: false, staleCount: staleItems.length, sent: false, message }, { status: 500 });
    }

    const origin = new URL(request.url).origin;
    const sent = await sendContentFreshnessReportEmail({
      recipientEmails: recipients,
      recipientName: "Администратор",
      items: staleItems.map((item) => ({
        title: item.title,
        href: `${origin}${item.href}`,
        docType: item.docType,
        ageDays: item.ageDays,
        lastVerifiedAt: item.lastVerifiedAt,
        nextReviewAt: item.nextReviewAt,
        status: item.status === "critical" ? "critical" : "stale",
      })),
      generatedAt: ranAt,
      dashboardUrl: `${origin}/admin/content-freshness`,
    });

    const message = sent
      ? `Отправлен отчёт по актуальности (${staleItems.length} материалов)`
      : `Отчёт не отправлен (${staleItems.length} материалов)`;

    writeCronRunStatus("contentFreshness", {
      ranAt,
      ok: sent,
      message,
      details: { staleCount: staleItems.length, sent },
    });
    await logCronResult(CRON_ROUTE, {
      ok: sent,
      ranAt,
      message,
      statusCode: sent ? 200 : 500,
      details: { staleCount: staleItems.length, sent },
    });

    return NextResponse.json({ ok: true, staleCount: staleItems.length, sent, message });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Неизвестная ошибка";
    writeCronRunStatus("contentFreshness", {
      ranAt,
      ok: false,
      message,
    });
    await logCronResult(CRON_ROUTE, {
      ok: false,
      ranAt,
      message,
      statusCode: 500,
      error,
    });
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const auth = authorizeCronRequest(request);
  if (!auth.ok) return auth.response;
  return runContentFreshnessCron(request);
}

export async function POST(request: Request) {
  const auth = authorizeCronRequest(request);
  if (!auth.ok) return auth.response;
  return runContentFreshnessCron(request);
}
