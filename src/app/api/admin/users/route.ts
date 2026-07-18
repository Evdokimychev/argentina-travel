import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { isUuid } from "@/lib/admin/user-identity-management";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AccountRoleDb } from "@/types/database";

type DirectoryPayload = { users: unknown[]; total: number; limit: number; offset: number };
type DirectoryRpcClient = {
  rpc(name: "admin_search_profiles", args: Record<string, unknown>): PromiseLike<{
    data: DirectoryPayload | null;
    error: { message: string } | null;
  }>;
};

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "users.view");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim().toLowerCase() ?? "";
  const roleValue = url.searchParams.get("role")?.trim() ?? "";
  const roleFilter = (["tourist", "organizer", "admin"] as const).includes(roleValue as AccountRoleDb)
    ? roleValue as AccountRoleDb
    : null;
  const statusValue = url.searchParams.get("status")?.trim() ?? "";
  const statusFilter = statusValue === "active" || statusValue === "blocked" ? statusValue : null;
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 50));
  const offset = Math.max(0, Number(url.searchParams.get("offset")) || 0);
  if (!isUuid(auth.actorId)) return NextResponse.json({ error: "Для поиска нужна личная сессия администратора." }, { status: 403 });

  const supabase = createSupabaseAdminClient() as unknown as DirectoryRpcClient;
  const { data, error } = await supabase.rpc("admin_search_profiles", {
    p_actor_user_id: auth.actorId,
    p_query: query || null,
    p_role: roleFilter,
    p_status: statusFilter,
    p_limit: limit,
    p_offset: offset,
  });
  if (error) {
    return NextResponse.json({ error: "Не удалось выполнить поиск пользователей." }, { status: 503 });
  }
  return NextResponse.json(data ?? { users: [], total: 0, limit, offset }, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
}
