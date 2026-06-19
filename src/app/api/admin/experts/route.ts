import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  fetchExpertInquiriesForAdmin,
  updateExpertInquiryStatus,
} from "@/lib/expert-inquiries-server";
import {
  fetchExpertByIdAdmin,
  fetchExpertsForAdmin,
} from "@/lib/local-experts-server";
import type { ExpertInquiryStatus, ExpertStatus } from "@/types/local-experts";

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "marketplace.moderation");
  if (!auth.ok) return auth.response;

  try {
    const url = new URL(request.url);
    const view = url.searchParams.get("view");
    const supabase = createSupabaseAdminClient();

    if (view === "inquiries") {
      const inquiries = await fetchExpertInquiriesForAdmin(supabase, 200);
      return NextResponse.json({ inquiries });
    }

    const statusParam = url.searchParams.get("status");
    const status =
      statusParam === "pending" ||
      statusParam === "published" ||
      statusParam === "archived"
        ? (statusParam as ExpertStatus)
        : "all";

    const experts = await fetchExpertsForAdmin(supabase, { status, limit: 200 });
    return NextResponse.json({ experts });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Query failed" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const auth = await authorizeAdminRequest(request, "marketplace.moderation");
  if (!auth.ok) return auth.response;

  try {
    const body = (await request.json()) as {
      id?: string;
      action?: "publish" | "archive" | "reject";
      inquiryId?: string;
      inquiryStatus?: ExpertInquiryStatus;
    };

    const supabase = createSupabaseAdminClient();

    if (body.inquiryId && body.inquiryStatus) {
      const result = await updateExpertInquiryStatus(
        supabase,
        body.inquiryId,
        body.inquiryStatus
      );
      if ("error" in result) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ ok: true });
    }

    if (!body.id || !body.action) {
      return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
    }

    const expert = await fetchExpertByIdAdmin(supabase, body.id);
    if (!expert) {
      return NextResponse.json({ error: "Эксперт не найден" }, { status: 404 });
    }

    const statusMap: Record<string, ExpertStatus> = {
      publish: "published",
      archive: "archived",
      reject: "archived",
    };
    const nextStatus = statusMap[body.action];
    if (!nextStatus) {
      return NextResponse.json({ error: "Неизвестное действие" }, { status: 400 });
    }

    const { error } = await supabase
      .from("local_experts")
      .update({ status: nextStatus })
      .eq("id", body.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, status: nextStatus });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Update failed" },
      { status: 500 }
    );
  }
}
