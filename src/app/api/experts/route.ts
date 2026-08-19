import { NextResponse } from "next/server";
import {
  fetchPublishedExperts,
  parseExpertCatalogFilters,
} from "@/lib/local-experts-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { unexpectedPublicApiError } from "@/lib/public-api/safe-error";

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const filters = parseExpertCatalogFilters(new URL(request.url).searchParams);
    const experts = await fetchPublishedExperts(supabase, filters);
    return NextResponse.json({ items: experts, total: experts.length });
  } catch {
    return NextResponse.json(unexpectedPublicApiError(), { status: 500 });
  }
}
