import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchExpertByIdAdmin } from "@/lib/local-experts-server";
import type { LocalExpertUpdate } from "@/types/database";
import type { ExpertCategory } from "@/types/local-experts";

const VALID_CATEGORIES: ExpertCategory[] = [
  "guide",
  "relocation",
  "photo",
  "family",
  "nature",
  "food",
];

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeAdminRequest(request, "marketplace.moderation");
  if (!auth.ok) return auth.response;

  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      name?: string;
      bio?: string;
      city?: string;
      categories?: ExpertCategory[];
      languages?: string[];
      slug?: string;
      status?: "pending" | "published" | "archived";
    };

    const supabase = createSupabaseAdminClient();
    const existing = await fetchExpertByIdAdmin(supabase, id);
    if (!existing) {
      return NextResponse.json({ error: "Эксперт не найден" }, { status: 404 });
    }

    const patch: LocalExpertUpdate = {};
    if (typeof body.name === "string" && body.name.trim()) patch.name = body.name.trim();
    if (typeof body.bio === "string") patch.bio = body.bio.trim();
    if (typeof body.city === "string" && body.city.trim()) patch.city = body.city.trim();
    if (Array.isArray(body.categories)) {
      patch.categories = body.categories.filter((item) => VALID_CATEGORIES.includes(item));
    }
    if (Array.isArray(body.languages)) {
      patch.languages = body.languages.map((item) => item.trim().toLowerCase()).filter(Boolean);
    }
    if (typeof body.slug === "string" && body.slug.trim()) {
      patch.slug = slugify(body.slug);
    }
    if (
      body.status === "pending" ||
      body.status === "published" ||
      body.status === "archived"
    ) {
      patch.status = body.status;
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "Нет данных для обновления" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("local_experts")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? "Update failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Update failed" },
      { status: 500 }
    );
  }
}
