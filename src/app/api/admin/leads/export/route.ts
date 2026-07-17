import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { escapeCsvCell } from "@/lib/admin/csv";
import {
  AdminExportTooLargeError,
  collectAdminExportRows,
} from "@/lib/admin/export-pagination";
import type { Database } from "@/types/database";

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "operations.leads");
  if (!auth.ok) return auth.response;

  const supabase = createSupabaseAdminClient();
  type NewsletterRow = Pick<
    Database["public"]["Tables"]["newsletter_subscribers"]["Row"],
    "id" | "email" | "source" | "locale" | "status" | "created_at"
  >;
  type ContactRow = Pick<
    Database["public"]["Tables"]["contact_submissions"]["Row"],
    "id" | "kind" | "name" | "email" | "phone" | "message" | "created_at"
  >;

  let newsletter: NewsletterRow[];
  let contacts: ContactRow[];
  try {
    [newsletter, contacts] = await Promise.all([
      collectAdminExportRows(async (from, to) => {
        const { data, error } = await supabase
          .from("newsletter_subscribers")
          .select("id, email, source, locale, status, created_at")
          .order("created_at", { ascending: false })
          .order("id", { ascending: false })
          .range(from, to);
        if (error) throw error;
        return data ?? [];
      }),
      collectAdminExportRows(async (from, to) => {
        const { data, error } = await supabase
          .from("contact_submissions")
          .select("id, kind, name, email, phone, message, created_at")
          .order("created_at", { ascending: false })
          .order("id", { ascending: false })
          .range(from, to);
        if (error) throw error;
        return data ?? [];
      }),
    ]);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof AdminExportTooLargeError
            ? "Выгрузка слишком большая для одного файла. Сузьте период или обратитесь к владельцу сайта."
            : "Не удалось подготовить выгрузку обращений. Попробуйте ещё раз.",
      },
      { status: error instanceof AdminExportTooLargeError ? 413 : 503 },
    );
  }

  const lines: string[] = [];
  lines.push("type,email,name,phone,message,source,status,created_at");

  for (const row of newsletter) {
    lines.push(
      [
        "newsletter",
        escapeCsvCell(row.email),
        "",
        "",
        "",
        escapeCsvCell(row.source),
        escapeCsvCell(row.status),
        row.created_at,
      ].join(",")
    );
  }

  for (const row of contacts) {
    lines.push(
      [
        escapeCsvCell(row.kind),
        escapeCsvCell(row.email ?? ""),
        escapeCsvCell(row.name),
        escapeCsvCell(row.phone ?? ""),
        escapeCsvCell(row.message),
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
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
