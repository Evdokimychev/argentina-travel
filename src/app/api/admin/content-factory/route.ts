import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { clientIpFromRequest, writeAdminAuditLog } from "@/lib/admin/audit";
import {
  createContentFactoryItem,
  fetchContentFactorySnapshot,
  processPublicationJobs,
  queueContentFactoryItem,
  saveAndVerifyConnection,
  verifyExistingConnection,
} from "@/lib/content-factory/server";
import {
  isContentChannel,
  isContentFactoryFormat,
  type ConnectionSetupInput,
  type ContentItemDraftInput,
} from "@/lib/content-factory/types";
import { ContentProviderError } from "@/lib/content-factory/provider-clients";
import { generateContentVariants } from "@/lib/content-factory/ai-generator";
import type { Json } from "@/types/database";

export const dynamic = "force-dynamic";

function recordValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function stringValue(value: unknown, max = 60_000): string {
  return typeof value === "string" ? value.slice(0, max) : "";
}

function jsonRecord(value: unknown): Record<string, Json | undefined> {
  const record = recordValue(value);
  return Object.fromEntries(
    Object.entries(record).filter(([, item]) => {
      if (item === null || ["string", "number", "boolean"].includes(typeof item)) return true;
      if (Array.isArray(item)) return item.every((nested) => nested === null || ["string", "number", "boolean"].includes(typeof nested));
      return false;
    }),
  ) as Record<string, Json | undefined>;
}

function parseConnection(body: Record<string, unknown>): ConnectionSetupInput {
  if (!isContentChannel(body.provider)) throw new Error("Неизвестный канал.");
  const secretRecord = recordValue(body.secrets);
  const secrets = Object.fromEntries(
    Object.entries(secretRecord).flatMap(([key, value]) => typeof value === "string" ? [[key, value]] : []),
  );
  return {
    provider: body.provider,
    label: stringValue(body.label, 120),
    externalAccountId: stringValue(body.externalAccountId, 250),
    handle: stringValue(body.handle, 250),
    config: jsonRecord(body.config),
    secrets,
  };
}

function parseItem(body: Record<string, unknown>): ContentItemDraftInput {
  const rawVariants = Array.isArray(body.variants) ? body.variants : [];
  const variants = rawVariants.map((raw) => {
    const variant = recordValue(raw);
    if (!isContentChannel(variant.channel) || !isContentFactoryFormat(variant.format)) {
      throw new Error("У версии материала указан неизвестный формат или канал.");
    }
    return {
      channel: variant.channel,
      format: variant.format,
      body: stringValue(variant.body),
      mediaUrls: Array.isArray(variant.mediaUrls)
        ? variant.mediaUrls.flatMap((value) => typeof value === "string" ? [value.slice(0, 2000)] : []).slice(0, 10)
        : [],
      linkUrl: stringValue(variant.linkUrl, 2000),
      target: stringValue(variant.target, 500),
      providerOptions: jsonRecord(variant.providerOptions),
      headline: stringValue(variant.headline, 240),
      altText: stringValue(variant.altText, 1000),
      hashtags: Array.isArray(variant.hashtags)
        ? variant.hashtags.flatMap((value) => typeof value === "string" ? [value.slice(0, 120)] : []).slice(0, 30)
        : [],
      firstComment: stringValue(variant.firstComment, 2200),
    };
  });
  return {
    title: stringValue(body.title, 240),
    brief: stringValue(body.brief, 5000),
    audience: stringValue(body.audience, 240),
    contentPillar: stringValue(body.contentPillar, 240),
    goal: stringValue(body.goal, 240),
    sourceDocumentId: stringValue(body.sourceDocumentId, 500),
    sourceCandidateId: stringValue(body.sourceCandidateId, 100),
    campaignId: stringValue(body.campaignId, 100),
    dueAt: stringValue(body.dueAt, 100),
    variants,
  };
}

function actionError(error: unknown): NextResponse {
  if (error instanceof ContentProviderError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: 422 });
  }
  if (error instanceof Error && !/supabase|postgres|relation|column|schema|vault/i.test(error.message)) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json(
    { error: "Контент-завод ещё не готов к работе. Проверьте применение миграции и подключение Supabase." },
    { status: 503 },
  );
}

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "content.edit");
  if (!auth.ok) return auth.response;
  try {
    return NextResponse.json({ factory: await fetchContentFactorySnapshot() });
  } catch {
    return NextResponse.json(
      {
        error: "Хранилище контент-завода ещё не подключено. Примените подготовленную миграцию Supabase.",
        code: "CONTENT_FACTORY_STORAGE_NOT_READY",
      },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = recordValue(await request.json());
  } catch {
    return NextResponse.json({ error: "Некорректный формат запроса." }, { status: 400 });
  }
  const action = stringValue(body.action, 40);

  if (action === "save_connection" || action === "verify_connection") {
    const auth = await authorizeAdminRequest(request, "system.settings");
    if (!auth.ok) return auth.response;
    try {
      const provider = body.provider;
      if (!isContentChannel(provider)) throw new Error("Неизвестный канал.");
      const result = action === "save_connection"
        ? await saveAndVerifyConnection(parseConnection(body), auth.actorId)
        : await verifyExistingConnection(provider);
      await writeAdminAuditLog({
        actorUserId: auth.actorId === "service-role" ? null : auth.actorId,
        action: action === "save_connection" ? "content_factory.connection_saved" : "content_factory.connection_verified",
        entityType: "social_channel_connection",
        entityId: provider,
        payload: { provider, accountLabel: result.accountLabel },
        ipAddress: clientIpFromRequest(request),
      });
      return NextResponse.json({ ok: true, message: `Подключение проверено: ${result.accountLabel}` });
    } catch (error) {
      return actionError(error);
    }
  }

  if (action === "create_item") {
    const auth = await authorizeAdminRequest(request, "content.edit");
    if (!auth.ok) return auth.response;
    try {
      const itemId = await createContentFactoryItem(parseItem(body), auth.actorId);
      await writeAdminAuditLog({
        actorUserId: auth.actorId === "service-role" ? null : auth.actorId,
        action: "content_factory.item_created",
        entityType: "content_factory_item",
        entityId: itemId,
        payload: { title: stringValue(body.title, 240) },
        ipAddress: clientIpFromRequest(request),
      });
      return NextResponse.json({ ok: true, itemId, message: "Черновик добавлен в контент-план." });
    } catch (error) {
      return actionError(error);
    }
  }

  if (action === "generate_variants") {
    const auth = await authorizeAdminRequest(request, "content.edit");
    if (!auth.ok) return auth.response;
    try {
      const rawChannels = Array.isArray(body.channels) ? body.channels : [];
      const channels = rawChannels.flatMap((value) => isContentChannel(value) ? [value] : []);
      const result = await generateContentVariants({
        title: stringValue(body.title, 240),
        brief: stringValue(body.brief, 5000),
        audience: stringValue(body.audience, 240) || "Путешественники по Аргентине",
        contentPillar: stringValue(body.contentPillar, 240) || "Практическая Аргентина",
        goal: stringValue(body.goal, 240) || "Польза и доверие",
        channels,
        sourceDocumentId: stringValue(body.sourceDocumentId, 500) || undefined,
        sourceCandidateId: stringValue(body.sourceCandidateId, 100) || undefined,
        actorId: auth.actorId,
      });
      await writeAdminAuditLog({
        actorUserId: auth.actorId === "service-role" ? null : auth.actorId,
        action: "content_factory.variants_generated",
        entityType: "content_factory_generation_run",
        entityId: result.runId ?? "fallback",
        payload: { mode: result.mode, model: result.model, channels, qualityScore: result.quality.score },
        ipAddress: clientIpFromRequest(request),
      });
      return NextResponse.json({ ok: true, generation: result });
    } catch (error) {
      return actionError(error);
    }
  }

  if (action === "schedule_item" || action === "publish_now") {
    const auth = await authorizeAdminRequest(request, "content.publish");
    if (!auth.ok) return auth.response;
    const itemId = stringValue(body.itemId, 100);
    if (!itemId) return NextResponse.json({ error: "Не указан материал." }, { status: 400 });
    try {
      const scheduledFor = action === "publish_now"
        ? new Date().toISOString()
        : stringValue(body.scheduledFor, 100);
      const jobIds = await queueContentFactoryItem({ itemId, scheduledFor, actorId: auth.actorId });
      const delivery = action === "publish_now"
        ? await processPublicationJobs({ jobIds, limit: jobIds.length })
        : null;
      await writeAdminAuditLog({
        actorUserId: auth.actorId === "service-role" ? null : auth.actorId,
        action: action === "publish_now" ? "content_factory.publish_now" : "content_factory.scheduled",
        entityType: "content_factory_item",
        entityId: itemId,
        payload: { scheduledFor, jobCount: jobIds.length, delivery },
        ipAddress: clientIpFromRequest(request),
      });
      return NextResponse.json({
        ok: true,
        jobIds,
        delivery,
        message: action === "publish_now" ? "Публикация обработана." : "Материал добавлен в расписание.",
      });
    } catch (error) {
      return actionError(error);
    }
  }

  return NextResponse.json({ error: "Неизвестное действие." }, { status: 400 });
}
