import { NextResponse } from "next/server";
import {
  fetchPublishedExperts,
  parseExpertCatalogFilters,
} from "@/lib/local-experts-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const filters = parseExpertCatalogFilters(new URL(request.url).searchParams);
    const experts = await fetchPublishedExperts(supabase, filters);
    return NextResponse.json({ items: experts, total: experts.length });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
