import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  insertConversationMessage,
  rowToThreadFromDb,
} from "@/lib/messaging/conversation-server";
import { notifyConversationMessageCreated } from "@/lib/notifications/messaging-notify";
import type { ExpertInquiryStatus, ExpertInquiryView } from "@/types/local-experts";
import type { LocalExpertView } from "@/types/local-experts";

type DbClient = SupabaseClient<Database>;

type InquiryRow = Database["public"]["Tables"]["expert_inquiries"]["Row"];

function rowToInquiryView(
  row: InquiryRow,
  expert: Pick<LocalExpertView, "name" | "slug">,
  profile?: { name: string; email: string | null },
  threadId?: string | null
): ExpertInquiryView {
  return {
    id: row.id,
    expertId: row.expert_id,
    expertName: expert.name,
    expertSlug: expert.slug,
    userId: row.user_id,
    userName: profile?.name ?? "Турист",
    userEmail: profile?.email ?? null,
    message: row.message,
    status: row.status as ExpertInquiryStatus,
    threadId: threadId ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function fetchProfileBrief(
  supabase: DbClient,
  userId: string
): Promise<{ name: string; email: string | null }> {
  const { data } = await supabase
    .from("profiles")
    .select("first_name, last_name, email")
    .eq("id", userId)
    .maybeSingle();

  const name = [data?.first_name, data?.last_name].filter(Boolean).join(" ").trim();
  return { name: name || "Турист", email: data?.email ?? null };
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value.trim());
}

export async function createExpertInquiry(input: {
  supabase: DbClient;
  expert: LocalExpertView;
  userId: string;
  message: string;
}): Promise<
  | { inquiry: ExpertInquiryView; threadId: string | null }
  | { error: string }
> {
  const text = input.message.trim();
  if (!text) return { error: "Введите сообщение" };
  if (text.length > 4000) return { error: "Сообщение слишком длинное" };

  if (input.expert.status !== "published") {
    return { error: "Эксперт недоступен для обращений" };
  }

  if (!isUuid(input.expert.id)) {
    return {
      error: "Обращения доступны после подключения базы данных с каталогом экспертов",
    };
  }

  const { data: inquiryRow, error: inquiryError } = await input.supabase
    .from("expert_inquiries")
    .insert({
      expert_id: input.expert.id,
      user_id: input.userId,
      message: text,
      status: "open",
    })
    .select("*")
    .single();

  if (inquiryError || !inquiryRow) {
    return { error: inquiryError?.message ?? "Не удалось отправить обращение" };
  }

  const profile = await fetchProfileBrief(input.supabase, input.userId);
  let threadId: string | null = null;

  if (input.expert.userId && input.expert.userId !== input.userId) {
    const { data: threadRow, error: threadError } = await input.supabase
      .from("conversation_threads")
      .insert({
        booking_id: null,
        expert_inquiry_id: inquiryRow.id,
        tourist_user_id: input.userId,
        organizer_user_id: input.expert.userId,
      })
      .select("*")
      .single();

    if (!threadError && threadRow) {
      threadId = threadRow.id;
      const thread = rowToThreadFromDb(threadRow);
      const messageResult = await insertConversationMessage(
        input.supabase,
        thread,
        input.userId,
        text
      );

      if ("message" in messageResult) {
        await notifyConversationMessageCreated({
          thread,
          message: messageResult.message,
        });
      }
    }
  }

  return {
    inquiry: rowToInquiryView(inquiryRow, input.expert, profile, threadId),
    threadId,
  };
}

export async function fetchExpertInquiriesForAdmin(
  supabase: DbClient,
  limit = 100
): Promise<ExpertInquiryView[]> {
  const { data: inquiries, error } = await supabase
    .from("expert_inquiries")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !inquiries?.length) return [];

  const expertIds = [...new Set(inquiries.map((row) => row.expert_id))];
  const userIds = [...new Set(inquiries.map((row) => row.user_id))];

  const [expertsResult, profilesResult, threadsResult] = await Promise.all([
    supabase.from("local_experts").select("id, name, slug").in("id", expertIds),
    supabase
      .from("profiles")
      .select("id, first_name, last_name, email")
      .in("id", userIds),
    supabase
      .from("conversation_threads")
      .select("id, expert_inquiry_id")
      .in(
        "expert_inquiry_id",
        inquiries.map((row) => row.id)
      ),
  ]);

  const expertById = new Map(
    (expertsResult.data ?? []).map((row) => [row.id, { name: row.name, slug: row.slug }])
  );
  const profileById = new Map(
    (profilesResult.data ?? []).map((row) => [
      row.id,
      {
        name: [row.first_name, row.last_name].filter(Boolean).join(" ").trim() || "Турист",
        email: row.email,
      },
    ])
  );
  const threadByInquiry = new Map(
    (threadsResult.data ?? []).map((row) => [row.expert_inquiry_id, row.id])
  );

  return inquiries.map((row) => {
    const expert = expertById.get(row.expert_id) ?? { name: "Эксперт", slug: "" };
    return rowToInquiryView(
      row,
      expert,
      profileById.get(row.user_id),
      threadByInquiry.get(row.id) ?? null
    );
  });
}

export async function updateExpertInquiryStatus(
  supabase: DbClient,
  inquiryId: string,
  status: ExpertInquiryStatus
): Promise<{ ok: true } | { error: string }> {
  const { error } = await supabase
    .from("expert_inquiries")
    .update({ status })
    .eq("id", inquiryId);

  if (error) return { error: error.message };
  return { ok: true };
}
