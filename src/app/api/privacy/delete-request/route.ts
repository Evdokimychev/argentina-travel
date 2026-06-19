import { NextResponse } from "next/server";
import { isSupabaseAuthEnabled } from "@/lib/auth-mode";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";

type DeleteRequestBody = {
  reason?: string;
};

export async function POST(request: Request) {
  if (!isSupabaseAuthEnabled()) {
    return NextResponse.json({ error: "Privacy API unavailable" }, { status: 503 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const sessionUser = await loadSessionUserFromSupabase(supabase);

    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: DeleteRequestBody = {};
    try {
      body = (await request.json()) as DeleteRequestBody;
    } catch {
      body = {};
    }

    const reason =
      typeof body.reason === "string" && body.reason.trim()
        ? body.reason.trim().slice(0, 2000)
        : null;

    const { data: existing } = await supabase
      .from("privacy_requests")
      .select("id, status")
      .eq("user_id", sessionUser.id)
      .eq("request_type", "delete")
      .in("status", ["pending", "approved", "processing", "failed"])
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        {
          error: "Запрос на удаление уже находится в обработке",
          requestId: existing.id,
          status: existing.status,
        },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from("privacy_requests")
      .insert({
        user_id: sessionUser.id,
        request_type: "delete",
        status: "pending",
        reason,
        metadata: {
          email: sessionUser.email,
          fullName: sessionUser.fullName,
        },
      })
      .select("id, status, requested_at")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "Не удалось создать запрос" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      requestId: data.id,
      status: data.status,
      requestedAt: data.requested_at,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
