import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { Booking } from "@/types/tourist";
import { buildSummary, groupItemsByCategory } from "@/lib/trip-prep-summary";
import {
  type OrganizerTripPrepSummary,
  type TripPrepCategory,
  type TripPrepChecklistResponse,
  type TripPrepItemView,
  type TripPrepTemplateView,
  type TripPrepTourType,
} from "@/types/trip-prep";

type DbClient = SupabaseClient<Database>;

type TemplateRow = Database["public"]["Tables"]["trip_prep_templates"]["Row"];
type ItemRow = Database["public"]["Tables"]["trip_prep_items"]["Row"];
type ProgressRow = Database["public"]["Tables"]["trip_prep_progress"]["Row"];

export function resolveTripPrepTourType(booking: Booking): TripPrepTourType {
  if (booking.bookingSource && booking.bookingSource !== "platform") {
    return "partner";
  }
  if (booking.guests === 1) return "individual";
  return "group";
}

export async function fetchTripPrepTemplateForBooking(
  supabase: DbClient,
  booking: Booking
): Promise<{ template: TemplateRow; items: ItemRow[] } | null> {
  const tourType = resolveTripPrepTourType(booking);

  const { data: typedTemplate } = await supabase
    .from("trip_prep_templates")
    .select("*")
    .eq("tour_type", tourType)
    .neq("is_default", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let template = typedTemplate as TemplateRow | null;

  if (!template) {
    const { data: defaultTemplate } = await supabase
      .from("trip_prep_templates")
      .select("*")
      .eq("is_default", true)
      .limit(1)
      .maybeSingle();
    template = (defaultTemplate as TemplateRow | null) ?? null;
  }

  if (!template) return null;

  const { data: items } = await supabase
    .from("trip_prep_items")
    .select("*")
    .eq("template_id", template.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  return {
    template,
    items: (items ?? []) as ItemRow[],
  };
}

export async function fetchTripPrepChecklist(
  supabase: DbClient,
  booking: Booking,
  userId: string
): Promise<TripPrepChecklistResponse | null> {
  const resolved = await fetchTripPrepTemplateForBooking(supabase, booking);
  if (!resolved) return null;

  const { template, items } = resolved;

  const { data: progressRows } = await supabase
    .from("trip_prep_progress")
    .select("item_id, checked_at")
    .eq("booking_id", booking.id)
    .eq("user_id", userId);

  const progressByItem = new Map<string, string>(
    ((progressRows ?? []) as Pick<ProgressRow, "item_id" | "checked_at">[]).map((row) => [
      row.item_id,
      row.checked_at,
    ])
  );

  const itemViews: TripPrepItemView[] = items.map((item) => {
    const checkedAt = progressByItem.get(item.id) ?? null;
    return {
      id: item.id,
      category: item.category as TripPrepCategory,
      title: item.title,
      description: item.description,
      sortOrder: item.sort_order,
      required: item.required,
      checked: Boolean(checkedAt),
      checkedAt,
    };
  });

  return {
    bookingId: booking.id,
    startDate: booking.startDate ?? null,
    tourTitle: booking.tourTitle,
    template: {
      id: template.id,
      name: template.name,
      tourType: template.tour_type as TripPrepTourType,
    },
    categories: groupItemsByCategory(itemViews),
    summary: buildSummary(itemViews),
  };
}

export async function toggleTripPrepProgress(
  supabase: DbClient,
  input: {
    bookingId: string;
    userId: string;
    itemId: string;
    checked: boolean;
  }
): Promise<boolean> {
  if (input.checked) {
    const { error } = await supabase.from("trip_prep_progress").upsert(
      {
        booking_id: input.bookingId,
        user_id: input.userId,
        item_id: input.itemId,
        checked_at: new Date().toISOString(),
      },
      { onConflict: "booking_id,user_id,item_id" }
    );
    return !error;
  }

  const { error } = await supabase
    .from("trip_prep_progress")
    .delete()
    .eq("booking_id", input.bookingId)
    .eq("user_id", input.userId)
    .eq("item_id", input.itemId);

  return !error;
}

export async function fetchOrganizerTripPrepSummary(
  supabase: DbClient,
  booking: Booking
): Promise<OrganizerTripPrepSummary> {
  const empty: OrganizerTripPrepSummary = {
    bookingId: booking.id,
    percentComplete: 0,
    itemsTotal: 0,
    itemsChecked: 0,
    requiredTotal: 0,
    requiredChecked: 0,
    isComplete: false,
    hasProgress: false,
  };

  const resolved = await fetchTripPrepTemplateForBooking(supabase, booking);
  if (!resolved) return empty;

  const userId = booking.userId;
  if (!userId) return { ...empty, itemsTotal: resolved.items.length };

  const { data: progressRows } = await supabase
    .from("trip_prep_progress")
    .select("item_id")
    .eq("booking_id", booking.id)
    .eq("user_id", userId);

  const checkedIds = new Set(
    ((progressRows ?? []) as Pick<ProgressRow, "item_id">[]).map((row) => row.item_id)
  );

  const items: TripPrepItemView[] = resolved.items.map((item) => ({
    id: item.id,
    category: item.category as TripPrepCategory,
    title: item.title,
    description: item.description,
    sortOrder: item.sort_order,
    required: item.required,
    checked: checkedIds.has(item.id),
    checkedAt: null,
  }));

  const summary = buildSummary(items);

  return {
    bookingId: booking.id,
    percentComplete: summary.percent,
    itemsTotal: summary.total,
    itemsChecked: summary.checked,
    requiredTotal: summary.requiredTotal,
    requiredChecked: summary.requiredChecked,
    isComplete: summary.isComplete,
    hasProgress: summary.checked > 0,
  };
}

function mapTemplateView(template: TemplateRow, items: ItemRow[]): TripPrepTemplateView {
  return {
    id: template.id,
    name: template.name,
    tourType: template.tour_type as TripPrepTourType,
    isDefault: template.is_default,
    createdAt: template.created_at,
    updatedAt: template.updated_at,
    items: items.map((item) => ({
      id: item.id,
      category: item.category as TripPrepCategory,
      title: item.title,
      description: item.description,
      sortOrder: item.sort_order,
      required: item.required,
    })),
  };
}

export async function fetchAllTripPrepTemplates(
  supabase: DbClient
): Promise<TripPrepTemplateView[]> {
  const { data: templates } = await supabase
    .from("trip_prep_templates")
    .select("*")
    .order("is_default", { ascending: false })
    .order("name", { ascending: true });

  if (!templates?.length) return [];

  const templateIds = templates.map((row) => row.id);
  const { data: items } = await supabase
    .from("trip_prep_items")
    .select("*")
    .in("template_id", templateIds)
    .order("sort_order", { ascending: true });

  const itemsByTemplate = new Map<string, ItemRow[]>();
  for (const item of (items ?? []) as ItemRow[]) {
    const list = itemsByTemplate.get(item.template_id) ?? [];
    list.push(item);
    itemsByTemplate.set(item.template_id, list);
  }

  return (templates as TemplateRow[]).map((template) =>
    mapTemplateView(template, itemsByTemplate.get(template.id) ?? [])
  );
}

export async function upsertTripPrepTemplate(
  supabase: DbClient,
  input: {
    id?: string;
    name: string;
    tourType: TripPrepTourType;
    isDefault?: boolean;
    items: Array<{
      id?: string;
      category: TripPrepCategory;
      title: string;
      description?: string | null;
      sortOrder: number;
      required?: boolean;
    }>;
  }
): Promise<TripPrepTemplateView | null> {
  const now = new Date().toISOString();
  let templateId = input.id;

  if (input.isDefault) {
    await supabase
      .from("trip_prep_templates")
      .update({ is_default: false, updated_at: now })
      .eq("is_default", true);
  }

  if (templateId) {
    const { error } = await supabase
      .from("trip_prep_templates")
      .update({
        name: input.name.trim(),
        tour_type: input.tourType,
        is_default: input.isDefault ?? false,
        updated_at: now,
      })
      .eq("id", templateId);
    if (error) return null;
  } else {
    const { data, error } = await supabase
      .from("trip_prep_templates")
      .insert({
        name: input.name.trim(),
        tour_type: input.tourType,
        is_default: input.isDefault ?? false,
      })
      .select("*")
      .single();
    if (error || !data) return null;
    templateId = data.id;
  }

  await supabase.from("trip_prep_items").delete().eq("template_id", templateId);

  if (input.items.length > 0) {
    const { error: itemsError } = await supabase.from("trip_prep_items").insert(
      input.items.map((item, index) => ({
        id: item.id,
        template_id: templateId!,
        category: item.category,
        title: item.title.trim(),
        description: item.description?.trim() || null,
        sort_order: item.sortOrder ?? (index + 1) * 10,
        required: item.required ?? false,
      }))
    );
    if (itemsError) return null;
  }

  const { data: template } = await supabase
    .from("trip_prep_templates")
    .select("*")
    .eq("id", templateId!)
    .maybeSingle();
  const { data: savedItems } = await supabase
    .from("trip_prep_items")
    .select("*")
    .eq("template_id", templateId!)
    .order("sort_order", { ascending: true });

  if (!template) return null;
  return mapTemplateView(template as TemplateRow, (savedItems ?? []) as ItemRow[]);
}

export async function deleteTripPrepTemplate(
  supabase: DbClient,
  templateId: string
): Promise<{ ok: boolean; error?: string }> {
  const { data: template } = await supabase
    .from("trip_prep_templates")
    .select("is_default")
    .eq("id", templateId)
    .maybeSingle();

  if (!template) return { ok: false, error: "Шаблон не найден" };
  if (template.is_default) {
    return { ok: false, error: "Нельзя удалить шаблон по умолчанию" };
  }

  const { error } = await supabase.from("trip_prep_templates").delete().eq("id", templateId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
