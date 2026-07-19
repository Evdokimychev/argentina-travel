import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getIngestionOverview } from "@/lib/ingestion/repository-server";

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "sources.view");
  if (!auth.ok) return auth.response;
  try { return NextResponse.json({ overview: await getIngestionOverview(createSupabaseAdminClient()) }); }
  catch { return NextResponse.json({ error: "Хранилище сбора данных пока недоступно" }, { status: 503 }); }
}
