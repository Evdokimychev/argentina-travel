import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { isUuid } from "@/lib/admin/user-identity-management";
import {
  EMAIL_TEMPLATE_CATALOG,
  renderConstrainedEmailTemplate,
  syntheticVariablesFor,
  validateEmailTemplateDefinition,
} from "@/lib/notifications/email-template-contract";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const MUTATION_FIELDS = new Set([
  "action",
  "eventKey",
  "locale",
  "subjectTemplate",
  "bodyBlocks",
  "expectedActiveId",
  "templateId",
  "expectedVersion",
  "sourceTemplateId",
]);

function hasUnknownFields(value: Record<string, unknown>): boolean {
  return Object.keys(value).some((key) => !MUTATION_FIELDS.has(key));
}

function integer(value: unknown): number | null {
  return Number.isSafeInteger(value) && Number(value) >= 1 ? Number(value) : null;
}

function safeMutationError(error: { code?: string; message?: string } | null) {
  if (error?.code === "40001" || error?.message?.includes("EMAIL_TEMPLATE_VERSION_CONFLICT")) {
    return NextResponse.json(
      { error: "Шаблон уже изменился в другой вкладке. Обновите список и повторите действие." },
      { status: 409 },
    );
  }
  return NextResponse.json(
    { error: "Не удалось сохранить шаблон. Действующая версия не изменена." },
    { status: 400 },
  );
}

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "system.settings");
  if (!auth.ok) return auth.response;
  const supabase = createSupabaseAdminClient();
  // Additive migration is intentionally not written into the shared generated types here.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("email_template_versions")
    .select("id, event_key, locale, version, status, subject_template, body_blocks, row_version, activated_at, created_at, updated_at, source_version_id")
    .order("event_key")
    .order("locale")
    .order("version", { ascending: false });
  if (error) {
    return NextResponse.json({ error: "Центр шаблонов временно недоступен" }, { status: 503 });
  }
  return NextResponse.json({ catalog: EMAIL_TEMPLATE_CATALOG, versions: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await authorizeAdminRequest(request, "system.settings");
  if (!auth.ok) return auth.response;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || Array.isArray(body) || hasUnknownFields(body)) {
    return NextResponse.json({ error: "Запрос содержит неизвестные поля" }, { status: 400 });
  }

  const action = typeof body.action === "string" ? body.action : "";
  const eventKey = typeof body.eventKey === "string" ? body.eventKey.trim() : "";
  const locale = typeof body.locale === "string" ? body.locale.trim() : "";
  const subjectTemplate = typeof body.subjectTemplate === "string" ? body.subjectTemplate.trim() : "";
  const catalogEntry = EMAIL_TEMPLATE_CATALOG.find((entry) => entry.eventKey === eventKey);
  if (!catalogEntry) {
    return NextResponse.json({ error: "Выберите поддерживаемое событие" }, { status: 400 });
  }
  const definition = validateEmailTemplateDefinition({
    eventKey,
    locale,
    subjectTemplate,
    bodyBlocks: body.bodyBlocks,
  });

  if (action === "preview") {
    if (!definition.ok) return NextResponse.json({ error: definition.error }, { status: 400 });
    const rendered = renderConstrainedEmailTemplate({
      eventKey: catalogEntry.eventKey,
      locale,
      subjectTemplate,
      bodyBlocks: definition.blocks,
      variables: syntheticVariablesFor(catalogEntry.eventKey),
    });
    if (!rendered) return NextResponse.json({ error: "Предпросмотр не собран" }, { status: 400 });
    return NextResponse.json({ preview: rendered });
  }

  if (!catalogEntry.connected) {
    return NextResponse.json(
      { error: "Этот системный шаблон не управляется в данном разделе" },
      { status: 409 },
    );
  }

  if (auth.via !== "session" || !isUuid(auth.actorId)) {
    return NextResponse.json({ error: "Изменения требуют личную сессию администратора" }, { status: 403 });
  }
  const supabase = createSupabaseAdminClient();
  // RPCs are service-role-only and write the audit row in the same transaction.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rpc = (supabase as any).rpc.bind(supabase);

  if (action === "create_draft") {
    if (!definition.ok) return NextResponse.json({ error: definition.error }, { status: 400 });
    const expectedActiveId = body.expectedActiveId === null ? null : typeof body.expectedActiveId === "string" && isUuid(body.expectedActiveId) ? body.expectedActiveId : undefined;
    if (expectedActiveId === undefined) return NextResponse.json({ error: "Обновите список действующих версий" }, { status: 400 });
    const { data, error } = await rpc("email_template_create_draft", {
      p_event_key: eventKey,
      p_locale: locale,
      p_subject_template: subjectTemplate,
      p_body_blocks: definition.blocks,
      p_expected_active_id: expectedActiveId,
      p_actor_user_id: auth.actorId,
    });
    if (error || !data) return safeMutationError(error);
    return NextResponse.json({ template: data }, { status: 201 });
  }

  const expectedVersion = integer(body.expectedVersion);
  if (!expectedVersion) return NextResponse.json({ error: "Обновите версию шаблона" }, { status: 400 });

  if (action === "update_draft") {
    if (!definition.ok) return NextResponse.json({ error: definition.error }, { status: 400 });
    const templateId = typeof body.templateId === "string" && isUuid(body.templateId) ? body.templateId : null;
    if (!templateId) return NextResponse.json({ error: "Шаблон не найден" }, { status: 400 });
    const { data, error } = await rpc("email_template_update_draft", {
      p_template_id: templateId,
      p_expected_event_key: eventKey,
      p_expected_version: expectedVersion,
      p_subject_template: subjectTemplate,
      p_body_blocks: definition.blocks,
      p_actor_user_id: auth.actorId,
    });
    if (error || !data) return safeMutationError(error);
    return NextResponse.json({ template: data });
  }

  if (action === "activate") {
    const templateId = typeof body.templateId === "string" && isUuid(body.templateId) ? body.templateId : null;
    if (!templateId) return NextResponse.json({ error: "Шаблон не найден" }, { status: 400 });
    const expectedActiveId = body.expectedActiveId === null
      ? null
      : typeof body.expectedActiveId === "string" && isUuid(body.expectedActiveId)
        ? body.expectedActiveId
        : undefined;
    if (expectedActiveId === undefined) return NextResponse.json({ error: "Обновите действующую версию" }, { status: 400 });
    const { data, error } = await rpc("email_template_activate", {
      p_template_id: templateId,
      p_expected_event_key: eventKey,
      p_expected_version: expectedVersion,
      p_expected_active_id: expectedActiveId,
      p_actor_user_id: auth.actorId,
    });
    if (error || !data) return safeMutationError(error);
    return NextResponse.json({ template: data });
  }

  if (action === "rollback") {
    const sourceTemplateId = typeof body.sourceTemplateId === "string" && isUuid(body.sourceTemplateId) ? body.sourceTemplateId : null;
    if (!sourceTemplateId) return NextResponse.json({ error: "Историческая версия не найдена" }, { status: 400 });
    const { data, error } = await rpc("email_template_rollback", {
      p_source_template_id: sourceTemplateId,
      p_expected_event_key: eventKey,
      p_expected_active_version: expectedVersion,
      p_actor_user_id: auth.actorId,
    });
    if (error || !data) return safeMutationError(error);
    return NextResponse.json({ template: data });
  }

  return NextResponse.json({ error: "Действие не поддерживается" }, { status: 400 });
}
