import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";
import { isSupabaseAuthEnabled } from "@/lib/auth-mode";
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

export async function POST(request: Request) {
  if (!isSupabaseAuthEnabled()) {
    return NextResponse.json({ error: "Сервис недоступен" }, { status: 503 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const sessionUser = await loadSessionUserFromSupabase(supabase);

    if (!sessionUser) {
      return NextResponse.json({ error: "Войдите в аккаунт" }, { status: 401 });
    }

    const body = (await request.json()) as {
      name?: string;
      bio?: string;
      city?: string;
      categories?: ExpertCategory[];
      languages?: string[];
    };

    const name = body.name?.trim();
    const city = body.city?.trim();
    const bio = body.bio?.trim() ?? "";

    if (!name || !city) {
      return NextResponse.json(
        { error: "Укажите имя и город" },
        { status: 400 }
      );
    }

    const categories = Array.isArray(body.categories)
      ? body.categories.filter((item) => VALID_CATEGORIES.includes(item))
      : ["guide"];

    const languages = Array.isArray(body.languages)
      ? body.languages.map((item) => item.trim().toLowerCase()).filter(Boolean)
      : ["ru"];

    const baseSlug = slugify(name) || "expert";
    const slug = `${baseSlug}-${sessionUser.id.slice(0, 8)}`;

    const { data: existingPending } = await supabase
      .from("local_experts")
      .select("id")
      .eq("user_id", sessionUser.id)
      .eq("status", "pending")
      .maybeSingle();

    if (existingPending) {
      return NextResponse.json(
        { error: "У вас уже есть заявка на модерации" },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from("local_experts")
      .insert({
        slug,
        name,
        bio,
        city,
        categories,
        languages,
        user_id: sessionUser.id,
        status: "pending",
        contact_mode: "message",
      })
      .select("id, slug, status")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "Не удалось отправить заявку" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: data.id,
      slug: data.slug,
      status: data.status,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
