import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "users.view");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim().toLowerCase() ?? "";

  const supabase = createSupabaseAdminClient();
  let dbQuery = supabase
    .from("profiles")
    .select("id, first_name, last_name, email, phone, roles, active_role, is_blocked, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const { data, error } = await dbQuery;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let users = data ?? [];
  if (query) {
    users = users.filter((user) => {
      const haystack = [
        user.first_name,
        user.last_name,
        user.email,
        user.phone,
        user.roles.join(" "),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }

  return NextResponse.json({
    users: users.map((user) => ({
      id: user.id,
      fullName: [user.first_name, user.last_name].filter(Boolean).join(" ").trim() || "—",
      email: user.email,
      phone: user.phone,
      roles: user.roles,
      activeRole: user.active_role,
      isBlocked: user.is_blocked ?? false,
      createdAt: user.created_at,
    })),
  });
}
