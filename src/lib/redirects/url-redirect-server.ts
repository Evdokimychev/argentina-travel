import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  mapUrlRedirectRow,
  normalizeUrlRedirectInput,
  validateUrlRedirectInput,
} from "@/lib/redirects/url-redirect-normalize";
import type { UrlRedirect, UrlRedirectInput } from "@/types/url-redirect";

const CACHE_TTL_MS = 60_000;

type RedirectMatch = Pick<UrlRedirect, "toPath" | "statusCode">;

let cache: { map: Map<string, RedirectMatch>; at: number } | null = null;

function writeCache(map: Map<string, RedirectMatch>): void {
  cache = { map, at: Date.now() };
}

function readCache(): Map<string, RedirectMatch> | null {
  if (!cache) return null;
  if (Date.now() - cache.at >= CACHE_TTL_MS) return null;
  return cache.map;
}

export function invalidateUrlRedirectCache(): void {
  cache = null;
}

async function loadActiveRedirectsMap(): Promise<Map<string, RedirectMatch>> {
  const cached = readCache();
  if (cached) return cached;

  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("url_redirects")
    .select("from_path, to_path, status_code")
    .eq("enabled", true)
    .limit(2000);

  const map = new Map<string, RedirectMatch>();
  for (const row of data ?? []) {
    map.set(row.from_path, {
      toPath: row.to_path,
      statusCode: row.status_code as RedirectMatch["statusCode"],
    });
  }

  writeCache(map);
  return map;
}

export async function matchUrlRedirect(pathname: string): Promise<RedirectMatch | null> {
  const normalized =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.replace(/\/+$/, "")
      : pathname;

  const map = await loadActiveRedirectsMap();
  return map.get(normalized) ?? null;
}

export async function listUrlRedirectsForAdmin(): Promise<UrlRedirect[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("url_redirects")
    .select("*")
    .order("from_path", { ascending: true });

  if (error || !data) return [];
  return data.map(mapUrlRedirectRow);
}

export async function createUrlRedirect(
  input: UrlRedirectInput,
  actorId: string
): Promise<{ redirect: UrlRedirect } | { error: string }> {
  const validationError = validateUrlRedirectInput(input);
  if (validationError) return { error: validationError };

  const normalized = normalizeUrlRedirectInput(input);
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("url_redirects")
    .insert({
      from_path: normalized.fromPath,
      to_path: normalized.toPath,
      status_code: normalized.statusCode ?? 301,
      enabled: normalized.enabled ?? true,
      note: normalized.note ?? null,
      created_by: actorId,
      updated_by: actorId,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") return { error: "Редирект с таким путём уже существует" };
    return { error: error.message };
  }

  invalidateUrlRedirectCache();
  return { redirect: mapUrlRedirectRow(data) };
}

export async function updateUrlRedirect(
  id: string,
  input: Partial<UrlRedirectInput>,
  actorId: string
): Promise<{ redirect: UrlRedirect } | { error: string }> {
  const supabase = createSupabaseAdminClient();
  const { data: existing } = await supabase.from("url_redirects").select("*").eq("id", id).maybeSingle();
  if (!existing) return { error: "Редирект не найден" };

  const merged: UrlRedirectInput = {
    fromPath: input.fromPath ?? existing.from_path,
    toPath: input.toPath ?? existing.to_path,
    statusCode: input.statusCode ?? (existing.status_code as UrlRedirectInput["statusCode"]),
    enabled: input.enabled ?? existing.enabled,
    note: input.note ?? existing.note ?? undefined,
  };

  const validationError = validateUrlRedirectInput(merged);
  if (validationError) return { error: validationError };

  const normalized = normalizeUrlRedirectInput(merged);

  const { data, error } = await supabase
    .from("url_redirects")
    .update({
      from_path: normalized.fromPath,
      to_path: normalized.toPath,
      status_code: normalized.statusCode ?? 301,
      enabled: normalized.enabled ?? true,
      note: normalized.note ?? null,
      updated_by: actorId,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") return { error: "Редирект с таким путём уже существует" };
    return { error: error.message };
  }

  invalidateUrlRedirectCache();
  return { redirect: mapUrlRedirectRow(data) };
}

export async function deleteUrlRedirect(id: string): Promise<{ ok: true } | { error: string }> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("url_redirects").delete().eq("id", id);
  if (error) return { error: error.message };
  invalidateUrlRedirectCache();
  return { ok: true };
}
