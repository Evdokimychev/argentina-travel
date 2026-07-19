import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ContactSubmissionStatus } from "@/types/database";

const STATUSES: ContactSubmissionStatus[] = ["new", "in_progress", "waiting", "resolved", "spam"];

function cleanSearch(value: string | null): string {
  return (value ?? "").trim().replace(/[%_,.()]/g, " ").replace(/\s+/g, " ").slice(0, 120);
}

function parsePage(value: string | null): number {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "operations.leads");
  if (!auth.ok) return auth.response;

  const supabase = createSupabaseAdminClient();
  const url = new URL(request.url);
  const page = parsePage(url.searchParams.get("page"));
  const limit = 50;
  const from = (page - 1) * limit;
  const search = cleanSearch(url.searchParams.get("q"));
  const requestedStatus = url.searchParams.get("status");
  const status = STATUSES.includes(requestedStatus as ContactSubmissionStatus)
    ? requestedStatus as ContactSubmissionStatus
    : null;

  let contactsQuery = supabase
    .from("contact_submissions")
    .select(
      "id, kind, name, email, phone, message, context, page_url, status, assigned_to, admin_notes, next_action_at, created_at, updated_at",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);
  if (status) contactsQuery = contactsQuery.eq("status", status);
  if (search) {
    const pattern = `%${search}%`;
    contactsQuery = contactsQuery.or(`name.ilike.${pattern},email.ilike.${pattern},phone.ilike.${pattern},message.ilike.${pattern}`);
  }

  const [newsletter, contacts] = await Promise.all([
    supabase
      .from("newsletter_subscribers")
      .select("id, email, source, locale, status, created_at")
      .order("created_at", { ascending: false })
      .limit(100),
    contactsQuery,
  ]);

  if (newsletter.error || contacts.error) {
    return NextResponse.json(
      {
        error: newsletter.error?.message ?? contacts.error?.message ?? "Query failed",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    newsletter: newsletter.data ?? [],
    contacts: contacts.data ?? [],
    contactsMeta: {
      page,
      limit,
      total: contacts.count ?? 0,
      pages: Math.max(1, Math.ceil((contacts.count ?? 0) / limit)),
    },
  });
}

export async function PATCH(request: Request) {
  const auth = await authorizeAdminRequest(request, "operations.leads");
  if (!auth.ok) return auth.response;
  const body = (await request.json()) as {
    id?: string;
    status?: ContactSubmissionStatus;
    adminNotes?: string;
    nextActionAt?: string | null;
  };
  if (!body.id || !/^[0-9a-f-]{36}$/i.test(body.id)) {
    return NextResponse.json({ error: "Некорректный идентификатор обращения" }, { status: 400 });
  }
  if (body.status !== undefined && !STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "Некорректный статус обращения" }, { status: 400 });
  }
  const patch: {
    status?: ContactSubmissionStatus;
    admin_notes?: string;
    next_action_at?: string | null;
  } = {};
  if (body.status !== undefined) patch.status = body.status;
  if (body.adminNotes !== undefined) patch.admin_notes = body.adminNotes.trim().slice(0, 4000);
  if (body.nextActionAt !== undefined) {
    if (body.nextActionAt !== null && Number.isNaN(Date.parse(body.nextActionAt))) {
      return NextResponse.json({ error: "Некорректная дата следующего действия" }, { status: 400 });
    }
    patch.next_action_at = body.nextActionAt;
  }
  if (!Object.keys(patch).length) {
    return NextResponse.json({ error: "Нет изменений" }, { status: 400 });
  }
  const { data, error } = await createSupabaseAdminClient()
    .from("contact_submissions")
    .update(patch)
    .eq("id", body.id)
    .select("id, status, admin_notes, next_action_at, updated_at")
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Обращение не найдено" }, { status: 404 });
  return NextResponse.json({ contact: data });
}
