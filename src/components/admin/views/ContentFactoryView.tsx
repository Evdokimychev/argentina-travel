"use client";

import { useMemo, useState } from "react";
import {
  CalendarClock,
  Camera,
  CheckCircle2,
  Inbox,
  MessageCircle,
  Plus,
  Radio,
  Send,
  Settings2,
  Sparkles,
} from "lucide-react";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminSidebar";
import CapabilityGate from "@/components/admin/CapabilityGate";
import InlineFeedback from "@/components/feedback/InlineFeedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { useAdminApi } from "@/hooks/useAdminApi";
import { cabinetCardClass, cabinetStatCardClass } from "@/lib/cabinet-ui";
import type {
  ConnectionSetupInput,
  ContentChannel,
  ContentFactoryFormat,
  ContentFactorySnapshot,
  SafeChannelConnection,
} from "@/lib/content-factory/types";

type FactoryResponse = { factory?: ContentFactorySnapshot };
type ViewMode = "overview" | "create" | "channels" | "inbox";

const CHANNEL_LABELS: Record<ContentChannel, string> = {
  telegram: "Telegram",
  instagram: "Instagram",
  whatsapp: "WhatsApp",
};

const CHANNEL_ICONS = {
  telegram: Send,
  instagram: Camera,
  whatsapp: MessageCircle,
} as const;

const STATUS_LABELS: Record<string, string> = {
  idea: "Идея",
  draft: "Черновик",
  review: "На проверке",
  approved: "Одобрено",
  scheduled: "Запланировано",
  published: "Опубликовано",
  failed: "Ошибка",
  pending: "В очереди",
  processing: "Публикуется",
  retry: "Повторная попытка",
  succeeded: "Принято каналом",
};

function localDateTime(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function ChannelBadge({ channel }: { channel: ContentChannel }) {
  const Icon = CHANNEL_ICONS[channel];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-2.5 py-1 text-xs font-semibold text-foreground">
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {CHANNEL_LABELS[channel]}
    </span>
  );
}

function ConnectionCard({
  provider,
  connection,
  busy,
  onSave,
  onVerify,
}: {
  provider: ContentChannel;
  connection?: SafeChannelConnection;
  busy: boolean;
  onSave: (input: ConnectionSetupInput) => Promise<void>;
  onVerify: (provider: ContentChannel) => Promise<void>;
}) {
  const isTelegram = provider === "telegram";
  const isInstagram = provider === "instagram";
  const [label, setLabel] = useState(connection?.label ?? CHANNEL_LABELS[provider]);
  const [accountId, setAccountId] = useState(connection?.externalAccountId ?? "");
  const [handle, setHandle] = useState(connection?.handle ?? "");
  const [chatId, setChatId] = useState(String(connection?.config.chatId ?? ""));
  const [phoneNumberId, setPhoneNumberId] = useState(String(connection?.config.phoneNumberId ?? ""));
  const [apiVersion, setApiVersion] = useState(String(connection?.config.apiVersion ?? "v25.0"));
  const [mainToken, setMainToken] = useState("");
  const [appSecret, setAppSecret] = useState("");
  const [verifyToken, setVerifyToken] = useState("");
  const configuredMainSecret = connection?.configuredSecrets.includes(isTelegram ? "bot_token" : "access_token");

  async function save() {
    await onSave({
      provider,
      label,
      externalAccountId: accountId,
      handle,
      config: isTelegram
        ? { chatId }
        : {
            apiVersion,
            graphBaseUrl: isInstagram ? "https://graph.instagram.com" : "https://graph.facebook.com",
            ...(isInstagram ? { instagramUserId: accountId } : { phoneNumberId }),
          },
      secrets: {
        [isTelegram ? "bot_token" : "access_token"]: mainToken,
        ...(isTelegram ? {} : { app_secret: appSecret, webhook_verify_token: verifyToken }),
      },
    });
    setMainToken("");
    setAppSecret("");
    setVerifyToken("");
  }

  return (
    <article className={`${cabinetCardClass} space-y-4 p-5`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <ChannelBadge channel={provider} />
          <p className="mt-2 text-sm text-slate">
            {connection?.status === "verified"
              ? "Подключение проверено"
              : connection
                ? "Данные сохранены, нужна проверка"
                : "Не подключено"}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
          connection?.status === "verified"
            ? "bg-emerald-50 text-emerald-700"
            : connection?.status === "error"
              ? "bg-red-50 text-red-700"
              : "bg-amber-50 text-amber-800"
        }`}>
          {connection?.status === "verified" ? "Готово" : connection?.status === "error" ? "Ошибка доступа" : "Настройка"}
        </span>
      </div>

      <div className="space-y-3">
        <label className="block space-y-1 text-sm font-medium text-foreground">
          Название в панели
          <Input value={label} onChange={(event) => setLabel(event.target.value)} />
        </label>
        {isTelegram ? (
          <>
            <label className="block space-y-1 text-sm font-medium text-foreground">
              Канал или chat_id
              <Input value={chatId} onChange={(event) => setChatId(event.target.value)} placeholder="@goargentina или -100…" />
            </label>
            <label className="block space-y-1 text-sm font-medium text-foreground">
              Публичное имя канала
              <Input value={handle} onChange={(event) => setHandle(event.target.value)} placeholder="@goargentina" />
            </label>
          </>
        ) : (
          <>
            <label className="block space-y-1 text-sm font-medium text-foreground">
              {isInstagram ? "Instagram User ID" : "WhatsApp Business Account ID (необязательно)"}
              <Input value={accountId} onChange={(event) => setAccountId(event.target.value)} />
            </label>
            {!isInstagram ? (
              <label className="block space-y-1 text-sm font-medium text-foreground">
                Phone Number ID
                <Input value={phoneNumberId} onChange={(event) => setPhoneNumberId(event.target.value)} />
              </label>
            ) : null}
            <label className="block space-y-1 text-sm font-medium text-foreground">
              Версия Meta Graph API
              <Input value={apiVersion} onChange={(event) => setApiVersion(event.target.value)} placeholder="v25.0" />
            </label>
          </>
        )}
        <label className="block space-y-1 text-sm font-medium text-foreground">
          {isTelegram ? "Токен бота" : "Токен доступа"}
          <Input
            type="password"
            autoComplete="new-password"
            value={mainToken}
            onChange={(event) => setMainToken(event.target.value)}
            placeholder={configuredMainSecret ? "Вставьте только для замены" : "Вставьте полученный токен"}
          />
        </label>
        {!isTelegram ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1 text-sm font-medium text-foreground">
              Секрет приложения
              <Input type="password" autoComplete="new-password" value={appSecret} onChange={(event) => setAppSecret(event.target.value)} />
            </label>
            <label className="block space-y-1 text-sm font-medium text-foreground">
              Проверочный токен вебхука
              <Input type="password" autoComplete="new-password" value={verifyToken} onChange={(event) => setVerifyToken(event.target.value)} />
            </label>
          </div>
        ) : null}
      </div>

      <div className="rounded-xl border border-border-subtle bg-surface-muted/50 p-3 text-xs leading-5 text-slate">
        {isTelegram ? (
          <p>
            Создайте бота через <a className="font-semibold text-sky hover:underline" href="https://t.me/BotFather" target="_blank" rel="noreferrer">@BotFather</a>,
            добавьте его администратором канала с правом публикации и вставьте токен сюда.
          </p>
        ) : (
          <p>
            Создайте приложение в <a className="font-semibold text-sky hover:underline" href="https://developers.facebook.com/apps/" target="_blank" rel="noreferrer">Meta for Developers</a>.
            {isInstagram
              ? " Подключите профессиональный аккаунт и выдайте приложению право публикации контента."
              : " Добавьте WhatsApp, выберите бизнес-номер и настройте вебхук после сохранения подключения."}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button disabled={busy || !label.trim() || (!mainToken.trim() && !configuredMainSecret)} onClick={() => void save()}>
          Сохранить и проверить
        </Button>
        {connection ? (
          <Button variant="outline" disabled={busy} onClick={() => void onVerify(provider)}>
            Проверить ещё раз
          </Button>
        ) : null}
      </div>
    </article>
  );
}

export default function ContentFactoryView() {
  const [mode, setMode] = useState<ViewMode>("overview");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ variant: "success" | "error"; message: string } | null>(null);
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [audience, setAudience] = useState("Путешественники по Аргентине");
  const [pillar, setPillar] = useState("Практическая Аргентина");
  const [goal, setGoal] = useState("Польза и доверие");
  const [sourceRef, setSourceRef] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [generationBusy, setGenerationBusy] = useState(false);
  const [selectedChannels, setSelectedChannels] = useState<ContentChannel[]>(["telegram", "instagram"]);
  const [channelBodies, setChannelBodies] = useState<Record<ContentChannel, string>>({ telegram: "", instagram: "", whatsapp: "" });
  const [channelFormats, setChannelFormats] = useState<Record<ContentChannel, ContentFactoryFormat>>({ telegram: "post", instagram: "post", whatsapp: "message" });
  const [mediaUrls, setMediaUrls] = useState<Record<ContentChannel, string>>({ telegram: "", instagram: "", whatsapp: "" });
  const [whatsappTarget, setWhatsappTarget] = useState("");
  const [whatsappTemplateName, setWhatsappTemplateName] = useState("");
  const [whatsappTemplateLanguage, setWhatsappTemplateLanguage] = useState("ru");
  const [scheduleValues, setScheduleValues] = useState<Record<string, string>>({});
  const { data, loading, error, refresh } = useAdminApi<FactoryResponse>("/api/admin/content-factory");
  const factory = data?.factory;
  const connectionMap = useMemo(
    () => new Map((factory?.connections ?? []).map((connection) => [connection.provider, connection])),
    [factory?.connections],
  );

  async function runAction(payload: Record<string, unknown>, successFallback = "Готово") {
    setBusy(true);
    setFeedback(null);
    try {
      const response = await fetch("/api/admin/content-factory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) throw new Error(result.error ?? "Действие не выполнено.");
      setFeedback({ variant: "success", message: result.message ?? successFallback });
      await refresh();
      return true;
    } catch (actionError) {
      setFeedback({ variant: "error", message: actionError instanceof Error ? actionError.message : "Действие не выполнено." });
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function createDraft() {
    const [sourceKind, sourceId] = sourceRef.split(":", 2);
    const ok = await runAction({
      action: "create_item",
      title,
      brief,
      audience,
      contentPillar: pillar,
      goal,
      sourceDocumentId: sourceKind === "cms" ? sourceId : "",
      sourceCandidateId: sourceKind === "candidate" ? sourceId : "",
      campaignId,
      dueAt: dueAt ? new Date(dueAt).toISOString() : "",
      variants: selectedChannels.map((channel) => ({
        channel,
        format: channelFormats[channel],
        body: channelBodies[channel],
        mediaUrls: mediaUrls[channel].trim() ? [mediaUrls[channel].trim()] : [],
        target: channel === "whatsapp" ? whatsappTarget : "",
        providerOptions: channel === "whatsapp" && channelFormats.whatsapp === "template"
          ? { templateName: whatsappTemplateName, languageCode: whatsappTemplateLanguage }
          : {},
        headline: title,
        altText: "",
        hashtags: [],
      })),
    });
    if (ok) {
      setTitle("");
      setBrief("");
      setChannelBodies({ telegram: "", instagram: "", whatsapp: "" });
      setMediaUrls({ telegram: "", instagram: "", whatsapp: "" });
      setMode("overview");
    }
  }

  async function generateDrafts() {
    const [sourceKind, sourceId] = sourceRef.split(":", 2);
    setGenerationBusy(true);
    setFeedback(null);
    try {
      const response = await fetch("/api/admin/content-factory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_variants",
          title,
          brief,
          audience,
          contentPillar: pillar,
          goal,
          channels: selectedChannels,
          sourceDocumentId: sourceKind === "cms" ? sourceId : "",
          sourceCandidateId: sourceKind === "candidate" ? sourceId : "",
        }),
      });
      const result = await response.json() as {
        error?: string;
        generation?: {
          mode: "ai" | "fallback";
          model: string;
          variants: Array<{ channel: ContentChannel; format: ContentFactoryFormat; body: string; hashtags: string[]; altText: string }>;
          quality: { score: number; warnings: string[]; factsNeedReview: string[] };
        };
      };
      if (!response.ok || !result.generation) throw new Error(result.error ?? "Не удалось подготовить версии.");
      const nextBodies = { ...channelBodies };
      const nextFormats = { ...channelFormats };
      for (const variant of result.generation.variants) {
        nextBodies[variant.channel] = variant.body;
        nextFormats[variant.channel] = variant.format;
      }
      setChannelBodies(nextBodies);
      setChannelFormats(nextFormats);
      const reviewCount = result.generation.quality.factsNeedReview.length;
      setFeedback({
        variant: "success",
        message: `${result.generation.mode === "ai" ? "AI-версии" : "Безопасные черновики"} подготовлены. Оценка ${result.generation.quality.score}/100${reviewCount ? ` · фактов на проверку: ${reviewCount}` : ""}.`,
      });
    } catch (generationError) {
      setFeedback({ variant: "error", message: generationError instanceof Error ? generationError.message : "Не удалось подготовить версии." });
    } finally {
      setGenerationBusy(false);
    }
  }

  function toggleChannel(channel: ContentChannel) {
    setSelectedChannels((current) => current.includes(channel)
      ? current.filter((item) => item !== channel)
      : [...current, channel]);
  }

  return (
    <CapabilityGate capability="content.edit">
      <AdminPageShell>
        <AdminPageHeader
          title="Контент-завод"
          subtitle="Один центр для идей, публикаций, каналов и обращений путешественников"
          actions={
            <Button onClick={() => setMode("create")}>
              <Plus className="h-4 w-4" aria-hidden />
              Новый материал
            </Button>
          }
        />

        <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Разделы контент-завода">
          {([
            ["overview", "План и очередь", CalendarClock],
            ["create", "Создать", Sparkles],
            ["channels", "Подключения", Settings2],
            ["inbox", "Сообщения", Inbox],
          ] as const).map(([id, label, Icon]) => (
            <Button key={id} variant={mode === id ? "default" : "outline"} size="sm" onClick={() => setMode(id)}>
              <Icon className="h-4 w-4" aria-hidden />
              {label}
            </Button>
          ))}
        </nav>

        {error ? (
          <InlineFeedback
            variant="error"
            title="Нужно подготовить хранилище"
            description={error}
          />
        ) : null}
        {feedback ? (
          <InlineFeedback
            variant={feedback.variant}
            title={feedback.variant === "success" ? "Готово" : "Нужно проверить"}
            description={feedback.message}
          />
        ) : null}
        {loading ? <p className="text-sm text-slate">Загружаем контент-план…</p> : null}

        {mode === "overview" ? (
          <>
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5" aria-label="Сводка контент-завода">
              {[
                ["Черновики", factory?.stats.drafts ?? 0],
                ["Запланировано", factory?.stats.scheduled ?? 0],
                ["Опубликовано", factory?.stats.published ?? 0],
                ["Ошибки доставки", factory?.stats.failedJobs ?? 0],
                ["Новые сообщения", factory?.stats.unreadMessages ?? 0],
              ].map(([label, value]) => (
                <article key={label} className={cabinetStatCardClass}>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate">{label}</p>
                  <p className="mt-2 font-heading text-2xl font-bold text-foreground">{value}</p>
                </article>
              ))}
            </section>

            <section className={`${cabinetCardClass} space-y-4 p-5`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-heading text-lg font-bold text-foreground">Контент-план</h2>
                  <p className="mt-1 text-sm text-slate">Черновики, расписание и результаты по всем каналам.</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setMode("create")}>Добавить идею</Button>
              </div>
              {!factory?.items.length ? (
                <div className="rounded-2xl border border-dashed border-border-subtle p-8 text-center">
                  <Sparkles className="mx-auto h-8 w-8 text-sky" aria-hidden />
                  <p className="mt-3 font-semibold text-foreground">План пока пуст</p>
                  <p className="mt-1 text-sm text-slate">Создайте первый материал и подготовьте отдельную версию для каждого канала.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {factory.items.map((item) => (
                    <article key={item.id} className="rounded-2xl border border-border-subtle bg-surface-elevated p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-foreground">{item.title}</h3>
                            <span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-semibold text-slate">
                              {STATUS_LABELS[item.status] ?? item.status}
                            </span>
                          </div>
                          {item.brief ? <p className="mt-2 max-w-3xl text-sm leading-6 text-slate">{item.brief}</p> : null}
                          <div className="mt-3 flex flex-wrap gap-2">
                            {item.variants.map((variant) => <ChannelBadge key={variant.id} channel={variant.channel} />)}
                          </div>
                        </div>
                        {item.status !== "published" && item.status !== "scheduled" ? (
                          <CapabilityGate capability="content.publish" fallback={null}>
                            <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-56">
                              <Input
                                type="datetime-local"
                                aria-label={`Время публикации: ${item.title}`}
                                value={scheduleValues[item.id] ?? localDateTime(item.scheduledAt)}
                                onChange={(event) => setScheduleValues((current) => ({ ...current, [item.id]: event.target.value }))}
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  disabled={busy}
                                  onClick={() => void runAction({ action: "publish_now", itemId: item.id })}
                                >
                                  <Radio className="h-4 w-4" aria-hidden />
                                  Сейчас
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={busy || !scheduleValues[item.id]}
                                  onClick={() => void runAction({
                                    action: "schedule_item",
                                    itemId: item.id,
                                    scheduledFor: new Date(scheduleValues[item.id]).toISOString(),
                                  })}
                                >
                                  В план
                                </Button>
                              </div>
                            </div>
                          </CapabilityGate>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className={`${cabinetCardClass} space-y-4 p-5`}>
              <h2 className="font-heading text-lg font-bold text-foreground">Очередь доставки</h2>
              {!factory?.jobs.length ? <p className="text-sm text-slate">Заданий на публикацию пока нет.</p> : (
                <ul className="divide-y divide-border-subtle">
                  {factory.jobs.slice(0, 20).map((job) => (
                    <li key={job.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                      <div>
                        <p className="font-semibold text-foreground">{job.itemTitle}</p>
                        <p className="mt-1 text-xs text-slate">{CHANNEL_LABELS[job.channel]} · {new Date(job.scheduledFor).toLocaleString("ru-RU")}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${job.status === "succeeded" ? "bg-emerald-50 text-emerald-700" : job.status === "failed" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"}`}>
                        {STATUS_LABELS[job.status] ?? job.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        ) : null}

        {mode === "create" ? (
          <section className={`${cabinetCardClass} space-y-6 p-5`}>
            <div>
              <h2 className="font-heading text-xl font-bold text-foreground">Новый материал</h2>
              <p className="mt-1 text-sm text-slate">Сначала общий замысел, затем отдельный текст для каждого выбранного канала.</p>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <label className="block space-y-1.5 text-sm font-medium text-foreground">
                Рабочее название
                <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Например: Как выбрать район Буэнос-Айреса" />
              </label>
              <label className="block space-y-1.5 text-sm font-medium text-foreground">
                Рубрика
                <Input value={pillar} onChange={(event) => setPillar(event.target.value)} />
              </label>
              <label className="block space-y-1.5 text-sm font-medium text-foreground">
                Для кого
                <Input value={audience} onChange={(event) => setAudience(event.target.value)} />
              </label>
              <label className="block space-y-1.5 text-sm font-medium text-foreground">
                Цель
                <Input value={goal} onChange={(event) => setGoal(event.target.value)} />
              </label>
              <label className="block space-y-1.5 text-sm font-medium text-foreground">
                Проверенный источник
                <NativeSelect value={sourceRef} onChange={(event) => setSourceRef(event.target.value)}>
                  <option value="">Замысел владельца — факты проверить вручную</option>
                  {(factory?.knowledgeSources ?? []).map((source) => (
                    <option key={`${source.kind}:${source.id}`} value={`${source.kind}:${source.id}`}>
                      {source.kind === "cms" ? "Сайт" : "Argentina Knowledge"}: {source.title}
                    </option>
                  ))}
                </NativeSelect>
              </label>
              <label className="block space-y-1.5 text-sm font-medium text-foreground">
                Кампания
                <NativeSelect value={campaignId} onChange={(event) => setCampaignId(event.target.value)}>
                  <option value="">Без кампании</option>
                  {(factory?.campaigns ?? []).filter((campaign) => campaign.status !== "archived").map((campaign) => (
                    <option key={campaign.id} value={campaign.id}>{campaign.name}</option>
                  ))}
                </NativeSelect>
              </label>
              <label className="block space-y-1.5 text-sm font-medium text-foreground">
                Редакционный срок
                <Input type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} />
              </label>
            </div>
            <label className="block space-y-1.5 text-sm font-medium text-foreground">
              Краткий замысел и польза
              <Textarea rows={4} value={brief} onChange={(event) => setBrief(event.target.value)} placeholder="Какую задачу читателя решаем, на какие знания опираемся и что он должен сделать дальше" />
            </label>
            <fieldset className="space-y-3">
              <legend className="text-sm font-bold text-foreground">Каналы</legend>
              <div className="flex flex-wrap gap-2">
                {(["telegram", "instagram", "whatsapp"] as const).map((channel) => (
                  <Button key={channel} variant={selectedChannels.includes(channel) ? "default" : "outline"} size="sm" onClick={() => toggleChannel(channel)}>
                    {selectedChannels.includes(channel) ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : null}
                    {CHANNEL_LABELS[channel]}
                  </Button>
                ))}
              </div>
            </fieldset>
            <div className="grid gap-4 xl:grid-cols-2">
              {selectedChannels.map((channel) => (
                <article key={channel} className="space-y-3 rounded-2xl border border-border-subtle bg-surface-muted/30 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <ChannelBadge channel={channel} />
                    <NativeSelect
                      value={channelFormats[channel]}
                      onChange={(event) => setChannelFormats((current) => ({ ...current, [channel]: event.target.value as ContentFactoryFormat }))}
                    >
                      <option value={channel === "whatsapp" ? "message" : "post"}>{channel === "whatsapp" ? "Сообщение" : "Публикация"}</option>
                      {channel === "instagram" ? <option value="reel">Короткое видео</option> : null}
                      {channel === "instagram" ? <option value="story">История</option> : null}
                      {channel === "whatsapp" ? <option value="template">Шаблон Meta</option> : null}
                    </NativeSelect>
                  </div>
                  <label className="block space-y-1.5 text-sm font-medium text-foreground">
                    Текст для {CHANNEL_LABELS[channel]}
                    <Textarea rows={8} value={channelBodies[channel]} onChange={(event) => setChannelBodies((current) => ({ ...current, [channel]: event.target.value }))} />
                  </label>
                  {channel !== "whatsapp" ? (
                    <label className="block space-y-1.5 text-sm font-medium text-foreground">
                      Публичная HTTPS-ссылка на изображение или видео
                      <Input list="content-factory-media" value={mediaUrls[channel]} onChange={(event) => setMediaUrls((current) => ({ ...current, [channel]: event.target.value }))} placeholder="https://…" />
                    </label>
                  ) : (
                    <div className="space-y-3">
                      <label className="block space-y-1.5 text-sm font-medium text-foreground">
                        Получатель WhatsApp
                        <Input value={whatsappTarget} onChange={(event) => setWhatsappTarget(event.target.value)} placeholder="54911… без пробелов" />
                      </label>
                      {channelFormats.whatsapp === "template" ? (
                        <div className="grid gap-3 sm:grid-cols-2">
                          <label className="block space-y-1.5 text-sm font-medium text-foreground">
                            Имя утверждённого шаблона
                            <Input value={whatsappTemplateName} onChange={(event) => setWhatsappTemplateName(event.target.value)} placeholder="tour_follow_up" />
                          </label>
                          <label className="block space-y-1.5 text-sm font-medium text-foreground">
                            Язык шаблона
                            <Input value={whatsappTemplateLanguage} onChange={(event) => setWhatsappTemplateLanguage(event.target.value)} placeholder="ru" />
                          </label>
                        </div>
                      ) : (
                        <p className="text-xs leading-5 text-slate">Свободный текст используйте только в допустимом окне ответа клиенту. Для маркетинга выберите утверждённый шаблон Meta.</p>
                      )}
                    </div>
                  )}
                </article>
              ))}
            </div>
            <datalist id="content-factory-media">
              {(factory?.mediaAssets ?? []).map((asset) => <option key={asset.id} value={asset.publicUrl}>{asset.title}</option>)}
            </datalist>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" disabled={generationBusy || busy || !title.trim() || !brief.trim() || selectedChannels.length === 0} onClick={() => void generateDrafts()}>
                <Sparkles className="h-4 w-4" aria-hidden />
                {generationBusy ? "Готовим версии…" : "Подготовить версии с AI"}
              </Button>
              <Button disabled={busy || !title.trim() || selectedChannels.length === 0 || selectedChannels.some((channel) => !channelBodies[channel].trim())} onClick={() => void createDraft()}>
                Сохранить черновик
              </Button>
              <Button variant="outline" onClick={() => setMode("overview")}>Отмена</Button>
            </div>
          </section>
        ) : null}

        {mode === "channels" ? (
          <CapabilityGate capability="system.settings" fallback={
            <InlineFeedback variant="info" title="Только для владельца" description="Подключения и ключи может менять владелец системных настроек." />
          }>
            <section className="grid gap-4 xl:grid-cols-3">
              {(["telegram", "instagram", "whatsapp"] as const).map((provider) => (
                <ConnectionCard
                  key={provider}
                  provider={provider}
                  connection={connectionMap.get(provider)}
                  busy={busy}
                  onSave={async (input) => { await runAction({ action: "save_connection", ...input }); }}
                  onVerify={async (channel) => { await runAction({ action: "verify_connection", provider: channel }); }}
                />
              ))}
            </section>
          </CapabilityGate>
        ) : null}

        {mode === "inbox" ? (
          <section className={`${cabinetCardClass} space-y-4 p-5`}>
            <div>
              <h2 className="font-heading text-lg font-bold text-foreground">Единый входящий ящик</h2>
              <p className="mt-1 text-sm text-slate">Последние обращения из WhatsApp и Instagram. Ответы появятся после подключения вебхуков.</p>
            </div>
            {!factory?.inbox.length ? (
              <div className="rounded-2xl border border-dashed border-border-subtle p-8 text-center">
                <Inbox className="mx-auto h-8 w-8 text-sky" aria-hidden />
                <p className="mt-3 font-semibold text-foreground">Новых сообщений нет</p>
                <p className="mt-1 text-sm text-slate">После настройки Meta входящие диалоги появятся здесь автоматически.</p>
              </div>
            ) : (
              <ul className="divide-y divide-border-subtle">
                {factory.inbox.map((thread) => (
                  <li key={thread.id} className="flex items-start justify-between gap-3 py-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <ChannelBadge channel={thread.provider} />
                        <p className="font-semibold text-foreground">{thread.displayName ?? thread.contactPhone ?? "Новый собеседник"}</p>
                      </div>
                      <p className="mt-2 text-sm text-slate">{thread.lastMessagePreview ?? "Сообщение без текста"}</p>
                    </div>
                    {thread.unreadCount > 0 ? <span className="rounded-full bg-sky px-2.5 py-1 text-xs font-bold text-white">{thread.unreadCount}</span> : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}
      </AdminPageShell>
    </CapabilityGate>
  );
}
