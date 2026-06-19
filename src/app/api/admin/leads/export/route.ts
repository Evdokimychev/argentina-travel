import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "operations.leads");
  if (!auth.ok) return auth.response;

  const supabase = createSupabaseAdminClient();
  const [newsletter, contacts] = await Promise.all([
    supabase
      .from("newsletter_subscribers")
      .select("email, source, locale, status, created_at")
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("contact_submissions")
      .select("kind, name, email, phone, message, created_at")
      .order("created_at", { ascending: false })
      .limit(500),
  ]);

  const lines: string[] = [];
  lines.push("type,email,name,phone,message,source,status,created_at");

  for (const row of newsletter.data ?? []) {
    lines.push(
      [
        "newsletter",
        csvEscape(row.email),
        "",
        "",
        "",
        csvEscape(row.source),
        csvEscape(row.status),
        row.created_at,
      ].join(",")
    );
  }

  for (const row of contacts.data ?? []) {
    lines.push(
      [
        csvEscape(row.kind),
        csvEscape(row.email ?? ""),
        csvEscape(row.name),
        csvEscape(row.phone ?? ""),
        csvEscape(row.message),
        "",
        "",
        row.created_at,
      ].join(",")
    );
  }

  const csv = lines.join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="leads-export.csv"',
    },
  });
}
