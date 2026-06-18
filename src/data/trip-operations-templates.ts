import type { OmitTripTaskFields, TripTaskTemplate } from "@/types/trip-operations-templates";
import type { TripTask } from "@/types/trip-operations";

function createTaskId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `task-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `task-${Date.now().toString(36)}`;
}

function toTasks(items: OmitTripTaskFields[]): TripTask[] {
  return items.map((task, index) => ({
    ...task,
    id: createTaskId(),
    sortOrder: index,
  }));
}

const BASE_TASKS: OmitTripTaskFields[] = [
  {
    title: "Подтвердить даты и время с клиентом",
    category: "communication",
    status: "pending",
    clientVisible: false,
  },
  {
    title: "Собрать данные участников (паспорта, контакты)",
    category: "documents",
    status: "pending",
    clientVisible: true,
  },
  {
    title: "Забронировать билеты в парк / на экскурсию",
    category: "tickets",
    status: "pending",
    clientVisible: true,
  },
  {
    title: "Уточнить проживание и точку встречи",
    category: "accommodation",
    status: "pending",
    clientVisible: false,
  },
  {
    title: "Организовать трансфер",
    category: "transport",
    status: "pending",
    clientVisible: true,
  },
  {
    title: "Отправить клиенту инструкции перед выездом",
    category: "communication",
    status: "pending",
    clientVisible: true,
  },
];

export const TRIP_TASK_TEMPLATES: TripTaskTemplate[] = [
  {
    id: "general",
    label: "Стандартный тур",
    tourSlugs: [],
    tasks: BASE_TASKS,
  },
  {
    id: "iguazu-falls",
    label: "Водопады Игуасу",
    tourSlugs: ["iguazu-falls"],
    tasks: [
      ...BASE_TASKS.slice(0, 2),
      {
        title: "Купить билеты в нацпарк (аргентинская сторона)",
        category: "tickets",
        status: "pending",
        clientVisible: true,
      },
      {
        title: "Оформить разрешение на бразильскую сторону (если нужно)",
        category: "documents",
        status: "pending",
        clientVisible: true,
      },
      ...BASE_TASKS.slice(2),
    ],
  },
  {
    id: "patagonia",
    label: "Патагония",
    tourSlugs: ["patagonia-glaciers"],
    tasks: [
      ...BASE_TASKS.slice(0, 2),
      {
        title: "Забронировать входы в нацпарки и ледник Перито-Морено",
        category: "tickets",
        status: "pending",
        clientVisible: true,
      },
      {
        title: "Согласовать проживание в Эль-Калафате / Эль-Чалтене",
        category: "accommodation",
        status: "pending",
        clientVisible: false,
      },
      {
        title: "Организовать внутренние перелёты или трансферы",
        category: "transport",
        status: "pending",
        clientVisible: true,
      },
      {
        title: "Проверить экипировку для треккинга",
        category: "other",
        status: "pending",
        clientVisible: true,
      },
      BASE_TASKS[5],
    ],
  },
  {
    id: "mendoza-wine",
    label: "Мендоса и винные маршруты",
    tourSlugs: ["mendoza-wine"],
    tasks: [
      ...BASE_TASKS.slice(0, 2),
      {
        title: "Забронировать дегустации и визиты в bodegas",
        category: "tickets",
        status: "pending",
        clientVisible: true,
      },
      {
        title: "Подтвердить отель и трансфер из аэропорта MDZ",
        category: "accommodation",
        status: "pending",
        clientVisible: false,
      },
      ...BASE_TASKS.slice(4),
    ],
  },
  {
    id: "buenos-aires-tango",
    label: "Буэнос-Айрес (индивидуально)",
    tourSlugs: ["buenos-aires-tango"],
    tasks: [
      {
        title: "Согласовать даты и точку встречи",
        category: "communication",
        status: "pending",
        clientVisible: false,
      },
      {
        title: "Уточнить интересы: tango, гастрономия, районы",
        category: "communication",
        status: "pending",
        clientVisible: true,
      },
      {
        title: "Забронировать шоу / milonga / экскурсию",
        category: "tickets",
        status: "pending",
        clientVisible: true,
      },
      {
        title: "Забронировать стол в ресторане (если нужно)",
        category: "other",
        status: "pending",
        clientVisible: false,
      },
      {
        title: "Организовать трансфер или встречу в отеле",
        category: "transport",
        status: "pending",
        clientVisible: true,
      },
      {
        title: "Отправить программу дня клиенту",
        category: "communication",
        status: "pending",
        clientVisible: true,
      },
    ],
  },
];

export function resolveTripTaskTemplateForSlug(tourSlug?: string): TripTaskTemplate {
  if (!tourSlug) return TRIP_TASK_TEMPLATES[0];
  const match = TRIP_TASK_TEMPLATES.find((template) =>
    template.tourSlugs.includes(tourSlug)
  );
  return match ?? TRIP_TASK_TEMPLATES[0];
}

export function buildTripTasksFromTemplate(templateId: string): TripTask[] {
  const template =
    TRIP_TASK_TEMPLATES.find((item) => item.id === templateId) ?? TRIP_TASK_TEMPLATES[0];
  return toTasks(template.tasks);
}

export function buildDefaultTripTasks(tourSlug?: string): TripTask[] {
  return buildTripTasksFromTemplate(resolveTripTaskTemplateForSlug(tourSlug).id);
}

export function listTripTaskTemplatesForSlug(tourSlug?: string): TripTaskTemplate[] {
  if (!tourSlug) return TRIP_TASK_TEMPLATES;
  const matched = TRIP_TASK_TEMPLATES.filter(
    (template) => template.id === "general" || template.tourSlugs.includes(tourSlug)
  );
  return matched.length > 0 ? matched : TRIP_TASK_TEMPLATES;
}
