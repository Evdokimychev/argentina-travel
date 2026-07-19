import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  CONTENT_FACTORY_PROJECT_KEY,
  isContentChannel,
  isContentFactoryFormat,
  type ConnectionSetupInput,
  type ContentChannel,
  type ContentFactoryItem,
  type ContentFactoryItemStatus,
  type ContentFactorySnapshot,
  type ContentFactoryVariant,
  type ContentItemDraftInput,
  type PublicationJobStatus,
  type SafeChannelConnection,
} from "@/lib/content-factory/types";
import {
  ContentProviderError,
  publishProviderVariant,
  verifyProviderConnection,
  type ProviderCredentials,
} from "@/lib/content-factory/provider-clients";
import type {
  ContentFactoryItemRow,
  ContentFactoryVariantRow,
  ContentPublicationJobRow,
  Json,
  SocialChannelConnectionRow,
} from "@/types/database";

const PROVIDER_SECRET_NAMES: Record<ContentChannel, readonly string[]> = {
  telegram: ["bot_token"],
  instagram: ["access_token", "app_secret", "webhook_verify_token"],
  whatsapp: ["access_token", "app_secret", "webhook_verify_token"],
};

function objectValue(value: Json): Record<string, Json | undefined> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, Json | undefined>
    : {};
}

function actorUuid(actorId: string): string | null {
  return actorId === "service-role" ? null : actorId;
}

function safeUrl(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error("Укажите корректную ссылку.");
  }
  if (url.protocol !== "https:" || url.username || url.password) {
    throw new Error("Допустимы только публичные HTTPS-ссылки без логина и пароля.");
  }
  return url.toString();
}

function mapConnection(
  row: SocialChannelConnectionRow,
  secretNames: string[],
): SafeChannelConnection | null {
  if (!isContentChannel(row.provider)) return null;
  return {
    id: row.id,
    provider: row.provider,
    label: row.label,
    externalAccountId: row.external_account_id,
    handle: row.handle,
    status: row.status as SafeChannelConnection["status"],
    config: objectValue(row.config),
    configuredSecrets: secretNames,
    lastVerifiedAt: row.last_verified_at,
    lastUsedAt: row.last_used_at,
    lastErrorCode: row.last_error_code,
  };
}

function mapVariant(row: ContentFactoryVariantRow): ContentFactoryVariant | null {
  if (!isContentChannel(row.channel) || !isContentFactoryFormat(row.format)) return null;
  return {
    id: row.id,
    channel: row.channel,
    format: row.format,
    body: row.body,
    mediaUrls: row.media_urls,
    linkUrl: row.link_url,
    target: row.target,
    status: row.status,
    providerOptions: objectValue(row.provider_options),
    publishedAt: row.published_at,
    externalUrl: row.external_url,
  };
}

function mapItem(row: ContentFactoryItemRow, variants: ContentFactoryVariant[]): ContentFactoryItem {
  return {
    id: row.id,
    sourceDocumentId: row.source_document_id,
    title: row.title,
    brief: row.brief,
    audience: row.audience,
    contentPillar: row.content_pillar,
    goal: row.goal,
    status: row.status as ContentFactoryItemStatus,
    priority: row.priority,
    scheduledAt: row.scheduled_at,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    variants,
  };
}

export async function fetchContentFactorySnapshot(): Promise<ContentFactorySnapshot> {
  const supabase = createSupabaseAdminClient();
  const [connectionResult, secretResult, itemResult, variantResult, jobResult, inboxResult] = await Promise.all([
    supabase
      .from("social_channel_connections")
      .select("*")
      .eq("project_key", CONTENT_FACTORY_PROJECT_KEY)
      .order("provider"),
    supabase.from("social_channel_secrets").select("connection_id, secret_name"),
    supabase
      .from("content_factory_items")
      .select("*")
      .eq("project_key", CONTENT_FACTORY_PROJECT_KEY)
      .order("updated_at", { ascending: false })
      .limit(100),
    supabase.from("content_factory_variants").select("*").order("created_at"),
    supabase
      .from("content_publication_jobs")
      .select("*")
      .order("scheduled_for", { ascending: false })
      .limit(100),
    supabase
      .from("social_inbox_threads")
      .select("*")
      .eq("project_key", CONTENT_FACTORY_PROJECT_KEY)
      .order("last_message_at", { ascending: false })
      .limit(50),
  ]);
  const error = connectionResult.error ?? secretResult.error ?? itemResult.error
    ?? variantResult.error ?? jobResult.error ?? inboxResult.error;
  if (error) throw error;

  const secretNames = new Map<string, string[]>();
  for (const secret of secretResult.data ?? []) {
    const current = secretNames.get(secret.connection_id) ?? [];
    current.push(secret.secret_name);
    secretNames.set(secret.connection_id, current);
  }
  const connections = (connectionResult.data ?? []).flatMap((row) => {
    const mapped = mapConnection(row, secretNames.get(row.id) ?? []);
    return mapped ? [mapped] : [];
  });
  const variantsByItem = new Map<string, ContentFactoryVariant[]>();
  const variantById = new Map<string, ContentFactoryVariantRow>();
  for (const row of variantResult.data ?? []) {
    variantById.set(row.id, row);
    const mapped = mapVariant(row);
    if (!mapped) continue;
    const current = variantsByItem.get(row.item_id) ?? [];
    current.push(mapped);
    variantsByItem.set(row.item_id, current);
  }
  const items = (itemResult.data ?? []).map((row) => mapItem(row, variantsByItem.get(row.id) ?? []));
  const itemById = new Map(items.map((item) => [item.id, item]));
  const jobs = (jobResult.data ?? []).flatMap((row) => {
    const variant = variantById.get(row.variant_id);
    if (!variant || !isContentChannel(variant.channel)) return [];
    return [{
      id: row.id,
      itemTitle: itemById.get(variant.item_id)?.title ?? "Материал",
      channel: variant.channel,
      status: row.status as PublicationJobStatus,
      scheduledFor: row.scheduled_for,
      attemptCount: row.attempt_count,
      externalUrl: row.external_url,
      errorSummary: row.error_summary,
    }];
  });
  const inbox = (inboxResult.data ?? []).flatMap((row) => {
    if (!isContentChannel(row.provider)) return [];
    return [{
      id: row.id,
      provider: row.provider,
      displayName: row.display_name,
      contactPhone: row.contact_phone,
      status: row.status,
      unreadCount: row.unread_count,
      lastMessagePreview: row.last_message_preview,
      lastMessageAt: row.last_message_at,
    }];
  });

  return {
    generatedAt: new Date().toISOString(),
    storageReady: true,
    stats: {
      drafts: items.filter((item) => ["idea", "draft", "review", "approved"].includes(item.status)).length,
      scheduled: items.filter((item) => item.status === "scheduled").length,
      published: items.filter((item) => item.status === "published").length,
      failedJobs: jobs.filter((job) => job.status === "failed").length,
      unreadMessages: inbox.reduce((sum, thread) => sum + thread.unreadCount, 0),
    },
    connections,
    items,
    jobs,
    inbox,
  };
}

function validateConnectionInput(input: ConnectionSetupInput): void {
  if (!input.label.trim() || input.label.trim().length > 120) {
    throw new Error("Укажите понятное название подключения.");
  }
  const allowedSecrets = new Set(PROVIDER_SECRET_NAMES[input.provider]);
  for (const [name, value] of Object.entries(input.secrets)) {
    if (!allowedSecrets.has(name)) throw new Error("Передан неизвестный тип ключа.");
    if (value && (value.length < 8 || value.length > 100_000)) {
      throw new Error("Ключ доступа выглядит некорректно.");
    }
  }
}

export async function getProviderCredentials(provider: ContentChannel): Promise<ProviderCredentials> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("content_factory_get_connection_credentials", {
    p_provider: provider,
    p_project_key: CONTENT_FACTORY_PROJECT_KEY,
  });
  if (error) throw error;
  const row = data?.[0];
  if (!row) throw new ContentProviderError("CONNECTION_NOT_FOUND", "Канал ещё не подключён.");
  const secretsObject = objectValue(row.secrets);
  const secrets = Object.fromEntries(
    Object.entries(secretsObject).flatMap(([key, value]) => typeof value === "string" ? [[key, value]] : []),
  );
  return {
    provider,
    connectionId: row.connection_id,
    externalAccountId: row.external_account_id,
    handle: row.handle,
    config: objectValue(row.config),
    secrets,
  };
}

export async function saveAndVerifyConnection(
  input: ConnectionSetupInput,
  actorId: string,
): Promise<{ accountLabel: string }> {
  validateConnectionInput(input);
  const supabase = createSupabaseAdminClient();
  const cleanSecrets = Object.fromEntries(
    Object.entries(input.secrets).flatMap(([key, value]) => value.trim() ? [[key, value.trim()]] : []),
  );
  const { error } = await supabase.rpc("content_factory_upsert_connection", {
    p_project_key: CONTENT_FACTORY_PROJECT_KEY,
    p_provider: input.provider,
    p_label: input.label.trim(),
    p_external_account_id: input.externalAccountId?.trim() ?? "",
    p_handle: input.handle?.trim() ?? "",
    p_config: input.config as Json,
    p_secret_values: cleanSecrets,
    p_actor_user_id: actorUuid(actorId),
  });
  if (error) throw error;

  try {
    const credentials = await getProviderCredentials(input.provider);
    const verified = await verifyProviderConnection(credentials);
    await supabase
      .from("social_channel_connections")
      .update({
        status: "verified",
        last_verified_at: new Date().toISOString(),
        last_error_code: null,
        updated_by: actorUuid(actorId),
      })
      .eq("id", credentials.connectionId);
    return verified;
  } catch (verificationError) {
    const credentials = await getProviderCredentials(input.provider);
    const code = verificationError instanceof ContentProviderError
      ? verificationError.code
      : "CONNECTION_VERIFY_FAILED";
    await supabase
      .from("social_channel_connections")
      .update({ status: "error", last_error_code: code, updated_by: actorUuid(actorId) })
      .eq("id", credentials.connectionId);
    throw verificationError;
  }
}

export async function verifyExistingConnection(provider: ContentChannel): Promise<{ accountLabel: string }> {
  const supabase = createSupabaseAdminClient();
  const credentials = await getProviderCredentials(provider);
  try {
    const result = await verifyProviderConnection(credentials);
    await supabase
      .from("social_channel_connections")
      .update({ status: "verified", last_verified_at: new Date().toISOString(), last_error_code: null })
      .eq("id", credentials.connectionId);
    return result;
  } catch (error) {
    const code = error instanceof ContentProviderError ? error.code : "CONNECTION_VERIFY_FAILED";
    await supabase
      .from("social_channel_connections")
      .update({ status: "error", last_error_code: code })
      .eq("id", credentials.connectionId);
    throw error;
  }
}

export async function createContentFactoryItem(
  input: ContentItemDraftInput,
  actorId: string,
): Promise<string> {
  const title = input.title.trim();
  if (title.length < 2 || title.length > 240) throw new Error("Название должно содержать от 2 до 240 символов.");
  if (!input.variants.length || input.variants.length > 3) throw new Error("Выберите хотя бы один канал.");
  const seen = new Set<ContentChannel>();
  const variants = input.variants.map((variant) => {
    if (seen.has(variant.channel)) throw new Error("Для одного канала можно создать только одну версию.");
    seen.add(variant.channel);
    const body = variant.body.trim();
    if (!body) throw new Error("Текст версии не может быть пустым.");
    if (body.length > 60_000) throw new Error("Текст слишком большой.");
    const mediaUrls = (variant.mediaUrls ?? []).map((url) => safeUrl(url)).filter((url): url is string => Boolean(url));
    return {
      channel: variant.channel,
      format: variant.format,
      body,
      media_urls: mediaUrls,
      link_url: safeUrl(variant.linkUrl),
      target: variant.target?.trim() || null,
      status: "draft",
      provider_options: (variant.providerOptions ?? {}) as Json,
    };
  });
  const supabase = createSupabaseAdminClient();
  const { data: item, error: itemError } = await supabase
    .from("content_factory_items")
    .insert({
      project_key: CONTENT_FACTORY_PROJECT_KEY,
      source_document_id: input.sourceDocumentId?.trim() || null,
      title,
      brief: input.brief?.trim() ?? "",
      audience: input.audience?.trim() || "Путешественники по Аргентине",
      content_pillar: input.contentPillar?.trim() || "Практическая Аргентина",
      goal: input.goal?.trim() || "Польза и доверие",
      status: "draft",
      created_by: actorUuid(actorId),
      updated_by: actorUuid(actorId),
    })
    .select("id")
    .single();
  if (itemError || !item) throw itemError ?? new Error("Не удалось создать материал.");
  const { error: variantError } = await supabase
    .from("content_factory_variants")
    .insert(variants.map((variant) => ({ ...variant, item_id: item.id })));
  if (variantError) {
    await supabase.from("content_factory_items").delete().eq("id", item.id);
    throw variantError;
  }
  return item.id;
}

export async function queueContentFactoryItem(input: {
  itemId: string;
  scheduledFor: string;
  actorId: string;
}): Promise<string[]> {
  const scheduledFor = new Date(input.scheduledFor);
  if (Number.isNaN(scheduledFor.getTime())) throw new Error("Укажите корректные дату и время публикации.");
  const supabase = createSupabaseAdminClient();
  const [{ data: variants, error: variantsError }, { data: connections, error: connectionError }] = await Promise.all([
    supabase.from("content_factory_variants").select("*").eq("item_id", input.itemId),
    supabase
      .from("social_channel_connections")
      .select("id, provider, status")
      .eq("project_key", CONTENT_FACTORY_PROJECT_KEY),
  ]);
  if (variantsError) throw variantsError;
  if (connectionError) throw connectionError;
  if (!variants?.length) throw new Error("У материала нет версий для публикации.");
  const connectionByProvider = new Map((connections ?? []).map((row) => [row.provider, row]));
  const existingResult = await supabase
    .from("content_publication_jobs")
    .select("variant_id, status")
    .in("variant_id", variants.map((variant) => variant.id))
    .in("status", ["pending", "processing", "retry"]);
  if (existingResult.error) throw existingResult.error;
  if (existingResult.data?.length) throw new Error("Материал уже находится в очереди публикации.");

  const jobs = variants.map((variant) => {
    const connection = connectionByProvider.get(variant.channel);
    if (!connection || connection.status !== "verified") {
      throw new Error(`Сначала подключите и проверьте канал ${variant.channel}.`);
    }
    if (variant.channel === "instagram" && variant.media_urls.length === 0) {
      throw new Error("Для Instagram добавьте изображение или видео.");
    }
    if (variant.channel === "whatsapp" && !variant.target) {
      throw new Error("Для WhatsApp укажите получателя или идентификатор пользователя.");
    }
    return {
      variant_id: variant.id,
      connection_id: connection.id,
      status: "pending",
      scheduled_for: scheduledFor.toISOString(),
      created_by: actorUuid(input.actorId),
    };
  });
  const { data, error } = await supabase
    .from("content_publication_jobs")
    .insert(jobs)
    .select("id");
  if (error) throw error;
  await Promise.all([
    supabase
      .from("content_factory_items")
      .update({ status: "scheduled", scheduled_at: scheduledFor.toISOString(), updated_by: actorUuid(input.actorId) })
      .eq("id", input.itemId),
    supabase
      .from("content_factory_variants")
      .update({ status: "scheduled" })
      .eq("item_id", input.itemId),
  ]);
  return (data ?? []).map((row) => row.id);
}

function safeProviderError(error: unknown): { code: string; summary: string } {
  if (error instanceof ContentProviderError) return { code: error.code, summary: error.message };
  return { code: "PROVIDER_REQUEST_FAILED", summary: "Внешний канал временно недоступен. Система попробует ещё раз." };
}

async function finishItemWhenPublished(itemId: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("content_factory_variants")
    .select("status")
    .eq("item_id", itemId);
  if (error || !data?.length || data.some((variant) => variant.status !== "published")) return;
  await supabase
    .from("content_factory_items")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", itemId);
}

async function processSingleJob(job: ContentPublicationJobRow): Promise<"succeeded" | "retry" | "failed" | "skipped"> {
  const supabase = createSupabaseAdminClient();
  const claimedAt = new Date().toISOString();
  const { data: claimed, error: claimError } = await supabase
    .from("content_publication_jobs")
    .update({ status: "processing", started_at: claimedAt, attempt_count: job.attempt_count + 1 })
    .eq("id", job.id)
    .in("status", ["pending", "retry"])
    .select("*")
    .maybeSingle();
  if (claimError) throw claimError;
  if (!claimed) return "skipped";

  const { data: variant, error: variantError } = await supabase
    .from("content_factory_variants")
    .select("*")
    .eq("id", claimed.variant_id)
    .single();
  if (variantError || !variant || !isContentChannel(variant.channel) || !isContentFactoryFormat(variant.format)) {
    await supabase
      .from("content_publication_jobs")
      .update({ status: "failed", finished_at: new Date().toISOString(), error_code: "INVALID_VARIANT", error_summary: "Версия материала повреждена." })
      .eq("id", claimed.id);
    return "failed";
  }
  await supabase.from("content_factory_variants").update({ status: "publishing" }).eq("id", variant.id);
  try {
    const credentials = await getProviderCredentials(variant.channel);
    const result = await publishProviderVariant(credentials, {
      format: variant.format,
      body: variant.body,
      mediaUrls: variant.media_urls,
      linkUrl: variant.link_url,
      target: variant.target,
      providerOptions: objectValue(variant.provider_options),
    });
    const finishedAt = new Date().toISOString();
    await Promise.all([
      supabase
        .from("content_publication_jobs")
        .update({
          status: "succeeded",
          finished_at: finishedAt,
          external_publication_id: result.externalId,
          external_url: result.externalUrl,
          error_code: null,
          error_summary: null,
          response_metadata: result.metadata as Json,
        })
        .eq("id", claimed.id),
      supabase
        .from("content_factory_variants")
        .update({ status: "published", published_at: finishedAt, external_url: result.externalUrl })
        .eq("id", variant.id),
      supabase
        .from("social_channel_connections")
        .update({ last_used_at: finishedAt, last_error_code: null })
        .eq("id", credentials.connectionId),
    ]);
    await finishItemWhenPublished(variant.item_id);
    return "succeeded";
  } catch (error) {
    const failure = safeProviderError(error);
    const shouldRetry = claimed.attempt_count < claimed.max_attempts;
    const retryAt = new Date(Date.now() + Math.pow(5, claimed.attempt_count) * 60_000).toISOString();
    await Promise.all([
      supabase
        .from("content_publication_jobs")
        .update({
          status: shouldRetry ? "retry" : "failed",
          scheduled_for: shouldRetry ? retryAt : claimed.scheduled_for,
          finished_at: shouldRetry ? null : new Date().toISOString(),
          error_code: failure.code,
          error_summary: failure.summary,
        })
        .eq("id", claimed.id),
      supabase.from("content_factory_variants").update({ status: shouldRetry ? "scheduled" : "failed" }).eq("id", variant.id),
      claimed.connection_id
        ? supabase.from("social_channel_connections").update({ last_error_code: failure.code }).eq("id", claimed.connection_id)
        : Promise.resolve(),
    ]);
    return shouldRetry ? "retry" : "failed";
  }
}

export async function processPublicationJobs(options?: {
  limit?: number;
  jobIds?: string[];
}): Promise<{ succeeded: number; retry: number; failed: number; skipped: number }> {
  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from("content_publication_jobs")
    .select("*")
    .in("status", ["pending", "retry"])
    .lte("scheduled_for", new Date().toISOString())
    .order("scheduled_for")
    .limit(Math.min(25, Math.max(1, options?.limit ?? 10)));
  if (options?.jobIds?.length) query = query.in("id", options.jobIds);
  const { data: jobs, error } = await query;
  if (error) throw error;
  const summary = { succeeded: 0, retry: 0, failed: 0, skipped: 0 };
  for (const job of jobs ?? []) {
    const status = await processSingleJob(job);
    summary[status] += 1;
  }
  return summary;
}
