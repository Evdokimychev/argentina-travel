import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { clientIpFromRequest, writeAdminAuditLog } from "@/lib/admin/audit";
import { describeSearchCredential } from "@/lib/seo/search-provider-clients";
import {
  deleteSearchProviderConnection,
  fetchSearchVisibilitySnapshot,
  saveSearchProviderConnection,
  syncSearchProvider,
} from "@/lib/seo/search-visibility-server";
import {
  isSearchVisibilityProvider,
  SearchProviderError,
} from "@/lib/seo/search-visibility-types";

export const dynamic = "force-dynamic";

function validPropertyUrl(value: string): boolean {
  if (/^sc-domain:[a-z0-9.-]+$/i.test(value)) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "analytics.view");
  if (!auth.ok) return auth.response;
  const daysParam = Number(new URL(request.url).searchParams.get("days") ?? "28");
  const days = Number.isInteger(daysParam) ? Math.min(365, Math.max(7, daysParam)) : 28;
  try {
    return NextResponse.json({ visibility: await fetchSearchVisibilitySnapshot(days) });
  } catch {
    return NextResponse.json(
      {
        error: "Поисковая аналитика ещё не готова. Проверьте применение последней миграции.",
        code: "SEO_STORAGE_NOT_READY",
      },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await authorizeAdminRequest(request, "system.settings");
  if (!auth.ok) return auth.response;
  let body: {
    action?: unknown;
    provider?: unknown;
    propertyUrl?: unknown;
    credential?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Некорректный формат запроса" }, { status: 400 });
  }
  if (!isSearchVisibilityProvider(body.provider)) {
    return NextResponse.json({ error: "Неизвестная поисковая система" }, { status: 400 });
  }

  try {
    if (body.action === "save") {
      const propertyUrl = typeof body.propertyUrl === "string" ? body.propertyUrl.trim() : "";
      const credential = typeof body.credential === "string" ? body.credential.trim() : "";
      if (propertyUrl.length > 500 || !validPropertyUrl(propertyUrl)) {
        return NextResponse.json({ error: "Укажите корректный адрес ресурса" }, { status: 400 });
      }
      if (credential.length < 8 || credential.length > 100_000) {
        return NextResponse.json({ error: "Ключ доступа выглядит некорректно" }, { status: 400 });
      }
      const credentialLabel = describeSearchCredential(body.provider, credential);
      await saveSearchProviderConnection({
        provider: body.provider,
        propertyUrl,
        secret: credential,
        credentialLabel,
        actorId: auth.actorId,
      });
      return NextResponse.json({ ok: true, message: "Подключение сохранено защищённо" });
    }

    if (body.action === "sync") {
      const result = await syncSearchProvider(body.provider, "admin");
      await writeAdminAuditLog({
        actorUserId: auth.actorId === "service-role" ? null : auth.actorId,
        action: "seo_search_performance_synced",
        entityType: "seo_provider_connection",
        entityId: body.provider,
        payload: result,
        ipAddress: clientIpFromRequest(request),
      });
      return NextResponse.json({ ok: true, ...result, message: "Поисковые запросы обновлены" });
    }

    if (body.action === "delete") {
      await deleteSearchProviderConnection({ provider: body.provider, actorId: auth.actorId });
      return NextResponse.json({ ok: true, message: "Подключение и сохранённые метрики удалены" });
    }
  } catch (error) {
    if (error instanceof SearchProviderError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 422 });
    }
    return NextResponse.json(
      { error: "Не удалось выполнить действие. Повторите позже.", code: "SEO_ACTION_FAILED" },
      { status: 503 },
    );
  }

  return NextResponse.json({ error: "Неизвестное действие" }, { status: 400 });
}
