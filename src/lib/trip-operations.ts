import type {
  BookingSource,
  TripClientRequirements,
  TripClientUpdate,
  TripClientUpdateKind,
  TripOperations,
  TripTask,
  TripTaskCategory,
  TripTaskStatus,
} from "@/types/trip-operations";
import { buildDefaultTripTasks } from "@/data/trip-operations-templates";

function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}-${Date.now().toString(36)}`;
}

export function createTripTaskId(): string {
  return createId("task");
}

export function createTripLinkId(): string {
  return createId("link");
}

const TASK_CATEGORIES: TripTaskCategory[] = [
  "tickets",
  "accommodation",
  "transport",
  "documents",
  "communication",
  "other",
];

const TASK_STATUSES: TripTaskStatus[] = ["pending", "in_progress", "done", "blocked"];

function normalizeTaskStatus(value: unknown): TripTaskStatus {
  if (typeof value === "string" && TASK_STATUSES.includes(value as TripTaskStatus)) {
    return value as TripTaskStatus;
  }
  return "pending";
}

function normalizeTaskCategory(value: unknown): TripTaskCategory {
  if (typeof value === "string" && TASK_CATEGORIES.includes(value as TripTaskCategory)) {
    return value as TripTaskCategory;
  }
  return "other";
}

function normalizeTasks(raw: TripTask[] | undefined): TripTask[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((task, index) => ({
      id: task.id || createTripTaskId(),
      title: task.title?.trim() ?? "",
      description: task.description?.trim() || undefined,
      category: normalizeTaskCategory(task.category),
      status: normalizeTaskStatus(task.status),
      dueDate: task.dueDate?.trim() || undefined,
      clientVisible: Boolean(task.clientVisible),
      completedAt: task.completedAt || undefined,
      sortOrder: typeof task.sortOrder === "number" ? task.sortOrder : index,
    }))
    .filter((task) => task.title.length > 0)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

function normalizeClientRequirements(
  raw: TripClientRequirements | undefined
): TripClientRequirements | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const trimmed = {
    flightArrival: raw.flightArrival?.trim() || undefined,
    flightDeparture: raw.flightDeparture?.trim() || undefined,
    hotelName: raw.hotelName?.trim() || undefined,
    hotelAddress: raw.hotelAddress?.trim() || undefined,
    hotelCheckIn: raw.hotelCheckIn?.trim() || undefined,
    hotelCheckOut: raw.hotelCheckOut?.trim() || undefined,
    dietaryRestrictions: raw.dietaryRestrictions?.trim() || undefined,
    mobilityNotes: raw.mobilityNotes?.trim() || undefined,
    specialRequests: raw.specialRequests?.trim() || undefined,
    submittedAt: raw.submittedAt || undefined,
  };
  const hasValue = Object.entries(trimmed).some(
    ([key, value]) => key !== "submittedAt" && Boolean(value)
  );
  if (!hasValue && !trimmed.submittedAt) return undefined;
  return trimmed;
}

function normalizeClientUpdates(raw: TripClientUpdate[] | undefined): TripClientUpdate[] {
  if (!Array.isArray(raw)) return [];
  const kinds: TripClientUpdateKind[] = ["task_status", "organizer_message"];
  return raw
    .map((item) => ({
      id: item.id || createId("update"),
      message: item.message?.trim() ?? "",
      createdAt: item.createdAt || new Date().toISOString(),
      kind: kinds.includes(item.kind as TripClientUpdateKind)
        ? (item.kind as TripClientUpdateKind)
        : "task_status",
    }))
    .filter((item) => item.message.length > 0)
    .slice(0, 30);
}

export function normalizeTripOperations(raw: TripOperations | undefined): TripOperations | undefined {
  if (!raw) return undefined;
  const tasks = normalizeTasks(raw.tasks);
  const resourceLinks = Array.isArray(raw.resourceLinks)
    ? raw.resourceLinks
        .map((link) => ({
          id: link.id || createTripLinkId(),
          title: link.title?.trim() ?? "",
          url: link.url?.trim() ?? "",
          description: link.description?.trim() || undefined,
          clientVisible: Boolean(link.clientVisible),
        }))
        .filter((link) => link.title.length > 0 && link.url.length > 0)
    : [];

  if (
    tasks.length === 0 &&
    resourceLinks.length === 0 &&
    !raw.organizerNotes?.trim() &&
    !raw.clientRequirements &&
    !(Array.isArray(raw.clientUpdates) && raw.clientUpdates.length > 0)
  ) {
    return undefined;
  }

  return {
    tasks,
    resourceLinks,
    clientRequirements: normalizeClientRequirements(raw.clientRequirements),
    clientUpdates: normalizeClientUpdates(raw.clientUpdates),
    organizerNotes: raw.organizerNotes?.trim() || undefined,
    updatedAt: raw.updatedAt || undefined,
  };
}

export function computeTripProgress(operations: TripOperations | undefined): {
  total: number;
  done: number;
  percent: number;
  clientTotal: number;
  clientDone: number;
  clientPercent: number;
} {
  const tasks = operations?.tasks ?? [];
  const total = tasks.length;
  const done = tasks.filter((task) => task.status === "done").length;
  const clientTasks = tasks.filter((task) => task.clientVisible);
  const clientTotal = clientTasks.length;
  const clientDone = clientTasks.filter((task) => task.status === "done").length;

  return {
    total,
    done,
    percent: total > 0 ? Math.round((done / total) * 100) : 0,
    clientTotal,
    clientDone,
    clientPercent: clientTotal > 0 ? Math.round((clientDone / clientTotal) * 100) : 0,
  };
}

export function resolveClientPortalToken(raw: {
  id: string;
  clientPortalToken?: string;
}): string {
  if (raw.clientPortalToken) return raw.clientPortalToken;
  let hash = 0;
  for (let i = 0; i < raw.id.length; i += 1) {
    hash = (hash * 37 + raw.id.charCodeAt(i)) >>> 0;
  }
  return `trip-${hash.toString(36).slice(0, 12)}`;
}

export function buildClientPortalUrl(token: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/trip/${token}`;
  }
  return `/trip/${token}`;
}

export function normalizeBookingSource(value: unknown): BookingSource {
  const sources: BookingSource[] = [
    "platform",
    "tripster",
    "viator",
    "getyourguide",
    "airbnb",
    "other",
  ];
  if (typeof value === "string" && sources.includes(value as BookingSource)) {
    return value as BookingSource;
  }
  return "platform";
}

function taskStatusClientMessage(task: TripTask, status: TripTaskStatus): string | null {
  if (!task.clientVisible) return null;
  switch (status) {
    case "done":
      return `Готово: ${task.title}`;
    case "in_progress":
      return `В работе: ${task.title}`;
    case "blocked":
      return `Уточняем детали: ${task.title}`;
    default:
      return null;
  }
}

/** Сообщения для ленты клиента при изменении статусов задач. */
export function collectClientUpdatesFromTaskChanges(
  previousTasks: TripTask[],
  nextTasks: TripTask[]
): string[] {
  const previousById = new Map(previousTasks.map((task) => [task.id, task]));
  const messages: string[] = [];

  for (const task of nextTasks) {
    const previous = previousById.get(task.id);
    if (!previous || previous.status === task.status) continue;
    const message = taskStatusClientMessage(task, task.status);
    if (message) messages.push(message);
  }

  return messages;
}

export function appendTripClientUpdates(
  operations: TripOperations,
  messages: string[],
  kind: TripClientUpdateKind = "task_status"
): TripOperations {
  if (messages.length === 0) return operations;
  const now = new Date().toISOString();
  const fresh: TripClientUpdate[] = messages.map((message) => ({
    id: createId("update"),
    message,
    createdAt: now,
    kind,
  }));
  const existing = normalizeClientUpdates(operations.clientUpdates);
  return {
    ...operations,
    clientUpdates: [...fresh, ...existing].slice(0, 30),
  };
}

export function mergeTripOperationsWithClientUpdates(input: {
  previous?: TripOperations;
  next: TripOperations;
}): TripOperations {
  const messages = collectClientUpdatesFromTaskChanges(
    input.previous?.tasks ?? [],
    input.next.tasks
  );
  return appendTripClientUpdates(input.next, messages);
}

export {
  buildDefaultTripTasks,
  buildTripTasksFromTemplate,
  listTripTaskTemplatesForSlug,
  resolveTripTaskTemplateForSlug,
} from "@/data/trip-operations-templates";

export function ensureTripOperations(
  existing: TripOperations | undefined,
  tourSlug?: string
): TripOperations {
  const normalized = normalizeTripOperations(existing);
  if (normalized?.tasks.length) return normalized;
  return {
    tasks: buildDefaultTripTasks(tourSlug),
    resourceLinks: [],
    updatedAt: new Date().toISOString(),
  };
}
