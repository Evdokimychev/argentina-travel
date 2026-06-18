"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Check,
  Circle,
  CircleDot,
  Copy,
  ExternalLink,
  Link2,
  ListChecks,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { useAuth } from "@/context/AuthContext";
import {
  initTripOperationsForBooking,
  updateTripOperations,
} from "@/lib/bookings-store";
import {
  buildClientPortalUrl,
  buildTripTasksFromTemplate,
  computeTripProgress,
  createTripLinkId,
  createTripTaskId,
  ensureTripOperations,
  listTripTaskTemplatesForSlug,
  resolveTripTaskTemplateForSlug,
  appendTripClientUpdates,
} from "@/lib/trip-operations";
import { BOOKINGS_UPDATED_EVENT, type Booking } from "@/types/tourist";
import {
  TRIP_TASK_CATEGORY_LABELS,
  TRIP_TASK_STATUS_LABELS,
  type TripOperations,
  type TripResourceLink,
  type TripTask,
  type TripTaskStatus,
} from "@/types/trip-operations";
import { cn } from "@/lib/cn";
import { tourDetailCalloutClass, tourDetailCardBorderClass, tourDetailInsetMutedClass } from "@/lib/tour-detail-ui";

interface OrganizerTripOperationsPanelProps {
  booking: Booking;
  onUpdated: (booking: Booking) => void;
}

function taskStatusIcon(status: TripTaskStatus) {
  if (status === "done") return Check;
  if (status === "in_progress") return CircleDot;
  return Circle;
}

function taskStatusClass(status: TripTaskStatus): string {
  if (status === "done") return "text-sky-dark bg-sky/10 ring-sky/20";
  if (status === "in_progress") return "text-sky-700 bg-sky-50 ring-sky-100";
  if (status === "blocked") return "text-amber-700 bg-amber-50 ring-amber-100";
  return "text-slate bg-gray-50 ring-gray-100";
}

export default function OrganizerTripOperationsPanel({
  booking,
  onUpdated,
}: OrganizerTripOperationsPanelProps) {
  const { user } = useAuth();
  const [operations, setOperations] = useState<TripOperations | undefined>(booking.tripOperations);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newLinkTitle, setNewLinkTitle] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [clientMessageDraft, setClientMessageDraft] = useState("");
  const [showClientMessageForm, setShowClientMessageForm] = useState(false);
  const templateOptions = listTripTaskTemplatesForSlug(booking.tourSlug);
  const defaultTemplateId = resolveTripTaskTemplateForSlug(booking.tourSlug).id;
  const [selectedTemplateId, setSelectedTemplateId] = useState(defaultTemplateId);

  useEffect(() => {
    setOperations(booking.tripOperations);
  }, [booking.tripOperations, booking.updatedAt]);

  const progress = computeTripProgress(operations);
  const portalUrl =
    typeof window !== "undefined"
      ? buildClientPortalUrl(booking.clientPortalToken ?? "")
      : `/trip/${booking.clientPortalToken ?? ""}`;

  const persist = useCallback(
    async (next: TripOperations) => {
      setSaving(true);
      const result = updateTripOperations({
        bookingId: booking.id,
        actor: user,
        tripOperations: next,
      });
      setSaving(false);
      if ("booking" in result) {
        setOperations(result.booking.tripOperations);
        onUpdated(result.booking);
      }
    },
    [booking.id, onUpdated, user]
  );

  function patchOperations(patch: Partial<TripOperations>) {
    const base = ensureTripOperations(operations, booking.tourSlug);
    void persist({ ...base, ...patch, updatedAt: new Date().toISOString() });
  }

  function updateTask(taskId: string, patch: Partial<TripTask>) {
    const base = ensureTripOperations(operations, booking.tourSlug);
    const tasks = base.tasks.map((task) => {
      if (task.id !== taskId) return task;
      const status = patch.status ?? task.status;
      return {
        ...task,
        ...patch,
        completedAt:
          status === "done"
            ? patch.completedAt ?? new Date().toISOString()
            : status === "pending"
              ? undefined
              : task.completedAt,
      };
    });
    patchOperations({ tasks });
  }

  function removeTask(taskId: string) {
    const base = ensureTripOperations(operations, booking.tourSlug);
    patchOperations({ tasks: base.tasks.filter((task) => task.id !== taskId) });
  }

  function addTask() {
    const title = newTaskTitle.trim();
    if (!title) return;
    const base = ensureTripOperations(operations, booking.tourSlug);
    const task: TripTask = {
      id: createTripTaskId(),
      title,
      category: "other",
      status: "pending",
      clientVisible: false,
      sortOrder: base.tasks.length,
    };
    patchOperations({ tasks: [...base.tasks, task] });
    setNewTaskTitle("");
  }

  function addLink() {
    const title = newLinkTitle.trim();
    const url = newLinkUrl.trim();
    if (!title || !url) return;
    const base = ensureTripOperations(operations, booking.tourSlug);
    const link: TripResourceLink = {
      id: createTripLinkId(),
      title,
      url,
      clientVisible: true,
    };
    patchOperations({ resourceLinks: [...base.resourceLinks, link] });
    setNewLinkTitle("");
    setNewLinkUrl("");
  }

  function removeLink(linkId: string) {
    const base = ensureTripOperations(operations, booking.tourSlug);
    patchOperations({
      resourceLinks: base.resourceLinks.filter((link) => link.id !== linkId),
    });
  }

  async function copyPortalLink() {
    try {
      await navigator.clipboard.writeText(portalUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function applyTemplate(templateId: string) {
    setSelectedTemplateId(templateId);
    const base = ensureTripOperations(operations, booking.tourSlug);
    void persist({
      ...base,
      tasks: buildTripTasksFromTemplate(templateId),
      updatedAt: new Date().toISOString(),
    });
  }

  async function handleInitWithTemplate() {
    setSaving(true);
    const result = initTripOperationsForBooking({ bookingId: booking.id, actor: user });
    setSaving(false);
    if ("error" in result) return;
    if (selectedTemplateId !== defaultTemplateId) {
      applyTemplate(selectedTemplateId);
      return;
    }
    setOperations(result.booking.tripOperations);
    onUpdated(result.booking);
  }

  if (!operations?.tasks.length) {
    return (
      <article className={cn(tourDetailCardBorderClass, "px-5 py-5 sm:px-6")}>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky/10 text-sky">
            <ListChecks className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-heading text-lg font-bold text-charcoal">Организация поездки</h2>
            <p className="mt-1 text-sm leading-relaxed text-slate">
              Чеклист подготовки, ссылки для клиента и личный кабинет поездки.
            </p>
            {templateOptions.length > 1 ? (
              <div className="mt-3">
                <label htmlFor="trip-template" className="text-xs font-medium text-slate">
                  Шаблон чеклиста
                </label>
                <NativeSelect
                  id="trip-template"
                  value={selectedTemplateId}
                  onChange={(event) => setSelectedTemplateId(event.target.value)}
                  className="mt-1"
                >
                  {templateOptions.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.label}
                    </option>
                  ))}
                </NativeSelect>
              </div>
            ) : null}
            <Button
              type="button"
              className="mt-4 rounded-2xl"
              disabled={saving}
              onClick={() => void handleInitWithTemplate()}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Начать организацию
            </Button>
          </div>
        </div>
      </article>
    );
  }

  const requirements = operations.clientRequirements;

  return (
    <article className={cn(tourDetailCardBorderClass, "px-5 py-5 sm:px-6")}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky/10 text-sky">
            <ListChecks className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-heading text-lg font-bold text-charcoal">Организация поездки</h2>
            <p className="mt-1 text-sm text-slate">
              {progress.done} из {progress.total} задач выполнено
              {progress.clientTotal > 0
                ? ` · для клиента видно ${progress.clientDone}/${progress.clientTotal}`
                : ""}
            </p>
          </div>
        </div>
        {saving ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-slate">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Сохранение…
          </span>
        ) : null}
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-sky transition-all"
          style={{ width: `${progress.percent}%` }}
        />
      </div>

      <div className={cn("mt-5", tourDetailCalloutClass)}>
        <p className="text-xs font-semibold uppercase tracking-wide text-sky-dark">
          Личный кабинет клиента
        </p>
        <p className="mt-1 text-sm text-charcoal">
          Отправьте ссылку туристу — там статус подготовки, ваши материалы и анкета потребностей.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Input readOnly value={portalUrl} className="bg-white font-mono text-xs sm:text-sm" />
          <Button type="button" variant="outline" className="shrink-0 rounded-xl" onClick={() => void copyPortalLink()}>
            <Copy className="h-4 w-4" />
            {copied ? "Скопировано" : "Копировать"}
          </Button>
        </div>
      </div>

      {(operations.clientUpdates?.length ?? 0) > 0 || showClientMessageForm ? (
        <div className={cn("mt-5", tourDetailInsetMutedClass, "p-4")}>
          <h3 className="text-sm font-semibold text-charcoal">Сообщения клиенту</h3>
          <p className="mt-1 text-xs text-slate">
            Появляются в портале поездки. Статусы задач с «видно клиенту» добавляются автоматически.
          </p>
          {operations.clientUpdates && operations.clientUpdates.length > 0 ? (
            <ul className="mt-3 max-h-40 space-y-2 overflow-y-auto">
              {operations.clientUpdates.slice(0, 8).map((update) => (
                <li
                  key={update.id}
                  className="rounded-xl border border-gray-100 bg-white px-3 py-2 text-sm"
                >
                  <p className="text-charcoal">{update.message}</p>
                  <p className="mt-0.5 text-xs text-slate">
                    {new Date(update.createdAt).toLocaleString("ru-RU")}
                    {update.kind === "organizer_message" ? " · от организатора" : " · статус"}
                  </p>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Input
              value={clientMessageDraft}
              onChange={(event) => setClientMessageDraft(event.target.value)}
              placeholder="Сообщение для клиента в портале…"
              className="bg-white"
            />
            <Button
              type="button"
              variant="outline"
              className="shrink-0 rounded-xl"
              disabled={saving || !clientMessageDraft.trim()}
              onClick={() => {
                const text = clientMessageDraft.trim();
                if (!text) return;
                const base = ensureTripOperations(operations, booking.tourSlug);
                const next = appendTripClientUpdates(base, [text], "organizer_message");
                setClientMessageDraft("");
                setShowClientMessageForm(true);
                void persist(next);
              }}
            >
              Отправить
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() => setShowClientMessageForm(true)}
          >
            Написать клиенту
          </Button>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-charcoal">Чеклист</h3>
        </div>
        {templateOptions.length > 1 ? (
          <div className="sm:min-w-[220px]">
            <label htmlFor="trip-template-active" className="text-xs font-medium text-slate">
              Шаблон
            </label>
            <NativeSelect
              id="trip-template-active"
              value={selectedTemplateId}
              onChange={(event) => applyTemplate(event.target.value)}
              className="mt-1"
            >
              {templateOptions.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.label}
                </option>
              ))}
            </NativeSelect>
          </div>
        ) : null}
      </div>
      <ul className="mt-3 space-y-2">
          {operations.tasks.map((task) => {
            const StatusIcon = taskStatusIcon(task.status);
            return (
              <li
                key={task.id}
                className="flex flex-col gap-2 rounded-2xl border border-gray-100 bg-gray-50/50 p-3 sm:flex-row sm:items-center"
              >
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <span
                    className={cn(
                      "mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-1",
                      taskStatusClass(task.status)
                    )}
                  >
                    <StatusIcon className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-charcoal">{task.title}</p>
                    <p className="mt-0.5 text-xs text-slate">
                      {TRIP_TASK_CATEGORY_LABELS[task.category]}
                      {task.clientVisible ? " · видно клиенту" : ""}
                      {task.dueDate ? ` · до ${task.dueDate}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2 pl-10 sm:pl-0">
                  <NativeSelect
                    value={task.status}
                    onChange={(event) =>
                      updateTask(task.id, { status: event.target.value as TripTaskStatus })
                    }
                    className="h-9 min-w-[130px] text-xs"
                    aria-label={`Статус: ${task.title}`}
                  >
                    {Object.entries(TRIP_TASK_STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </NativeSelect>
                  <label className="flex items-center gap-1.5 text-xs text-slate">
                    <input
                      type="checkbox"
                      checked={task.clientVisible}
                      onChange={(event) =>
                        updateTask(task.id, { clientVisible: event.target.checked })
                      }
                      className="rounded border-gray-300"
                    />
                    Клиенту
                  </label>
                  <button
                    type="button"
                    onClick={() => removeTask(task.id)}
                    className="rounded-lg p-1.5 text-slate transition-colors hover:bg-red-50 hover:text-red-600"
                    aria-label="Удалить задачу"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
        <div className="mt-3 flex gap-2">
          <Input
            value={newTaskTitle}
            onChange={(event) => setNewTaskTitle(event.target.value)}
            placeholder="Новая задача, например: купить билеты на поезд"
            onKeyDown={(event) => {
              if (event.key === "Enter") addTask();
            }}
          />
          <Button type="button" variant="outline" className="shrink-0 rounded-xl" onClick={addTask}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-charcoal">Ссылки и материалы</h3>
        {operations.resourceLinks.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {operations.resourceLinks.map((link) => (
              <li
                key={link.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-sky hover:underline"
                  >
                    <Link2 className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{link.title}</span>
                    <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
                  </a>
                  {link.description ? (
                    <p className="mt-0.5 truncate text-xs text-slate">{link.description}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => removeLink(link.id)}
                  className="shrink-0 rounded-lg p-1.5 text-slate hover:bg-red-50 hover:text-red-600"
                  aria-label="Удалить ссылку"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-slate">Добавьте ссылки на билеты, карты, формы.</p>
        )}
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <Input
            value={newLinkTitle}
            onChange={(event) => setNewLinkTitle(event.target.value)}
            placeholder="Название"
          />
          <Input
            value={newLinkUrl}
            onChange={(event) => setNewLinkUrl(event.target.value)}
            placeholder="https://…"
          />
          <Button type="button" variant="outline" className="rounded-xl" onClick={addLink}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {requirements?.submittedAt ? (
        <div className={cn("mt-6", tourDetailInsetMutedClass, "p-4")}>
          <h3 className="text-sm font-semibold text-charcoal">Анкета клиента</h3>
          <p className="mt-1 text-xs text-slate">
            Заполнено {new Date(requirements.submittedAt).toLocaleString("ru-RU")}
          </p>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            {requirements.flightArrival ? (
              <>
                <dt className="text-slate">Прилёт</dt>
                <dd className="text-charcoal">{requirements.flightArrival}</dd>
              </>
            ) : null}
            {requirements.flightDeparture ? (
              <>
                <dt className="text-slate">Вылет</dt>
                <dd className="text-charcoal">{requirements.flightDeparture}</dd>
              </>
            ) : null}
            {requirements.hotelName ? (
              <>
                <dt className="text-slate">Отель</dt>
                <dd className="text-charcoal">{requirements.hotelName}</dd>
              </>
            ) : null}
            {requirements.hotelAddress ? (
              <>
                <dt className="text-slate">Адрес</dt>
                <dd className="text-charcoal">{requirements.hotelAddress}</dd>
              </>
            ) : null}
            {requirements.dietaryRestrictions ? (
              <>
                <dt className="text-slate">Питание</dt>
                <dd className="text-charcoal">{requirements.dietaryRestrictions}</dd>
              </>
            ) : null}
            {requirements.specialRequests ? (
              <>
                <dt className="text-slate">Пожелания</dt>
                <dd className="col-span-full text-charcoal">{requirements.specialRequests}</dd>
              </>
            ) : null}
          </dl>
        </div>
      ) : null}

      <div className="mt-6">
        <label htmlFor="trip-organizer-notes" className="text-sm font-semibold text-charcoal">
          Заметки организатора
        </label>
        <textarea
          id="trip-organizer-notes"
          rows={3}
          defaultValue={operations.organizerNotes ?? ""}
          onBlur={(event) => {
            const value = event.target.value.trim();
            if (value === (operations.organizerNotes ?? "")) return;
            patchOperations({ organizerNotes: value || undefined });
          }}
          placeholder="Внутренние заметки — клиент их не видит"
          className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-3 py-2.5 text-sm text-charcoal outline-none ring-brand/30 focus:border-brand focus:ring-2"
        />
      </div>
    </article>
  );
}
