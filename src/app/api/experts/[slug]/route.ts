import { NextResponse } from "next/server";
import { fetchExpertBySlug } from "@/lib/local-experts-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const supabase = await createSupabaseServerClient();
    const expert = await fetchExpertBySlug(supabase, slug);

    if (!expert) {
      return NextResponse.json({ error: "Эксперт не найден" }, { status: 404 });
    }

    return NextResponse.json(expert);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
