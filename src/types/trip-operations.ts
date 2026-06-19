/** Источник бронирования — платформа или внешняя площадка. */
export type BookingSource =
  | "platform"
  | "tripster"
  | "viator"
  | "getyourguide"
  | "airbnb"
  | "other";

export type TripTaskCategory =
  | "tickets"
  | "accommodation"
  | "transport"
  | "documents"
  | "communication"
  | "other";

export type TripTaskStatus = "pending" | "in_progress" | "done" | "blocked";

export interface TripTask {
  id: string;
  title: string;
  description?: string;
  category: TripTaskCategory;
  status: TripTaskStatus;
  /** ISO date YYYY-MM-DD */
  dueDate?: string;
  /** Показывать статус задачи туристу в личном кабинете поездки. */
  clientVisible: boolean;
  completedAt?: string;
  sortOrder: number;
}

export interface TripResourceLink {
  id: string;
  title: string;
  url: string;
  description?: string;
  clientVisible: boolean;
}

/** Анкета потребностей клиента — заполняется туристом по ссылке. */
export interface TripClientRequirements {
  flightArrival?: string;
  flightDeparture?: string;
  hotelName?: string;
  hotelAddress?: string;
  hotelCheckIn?: string;
  hotelCheckOut?: string;
  dietaryRestrictions?: string;
  mobilityNotes?: string;
  specialRequests?: string;
  submittedAt?: string;
}

export interface TripOperations {
  tasks: TripTask[];
  resourceLinks: TripResourceLink[];
  clientRequirements?: TripClientRequirements;
  /** Лента обновлений для клиента в портале поездки. */
  clientUpdates?: TripClientUpdate[];
  /** Внутренние заметки организатора по поездке. */
  organizerNotes?: string;
  updatedAt?: string;
}

export type TripClientUpdateKind = "task_status" | "organizer_message";

export interface TripClientUpdate {
  id: string;
  message: string;
  createdAt: string;
  kind: TripClientUpdateKind;
}

export const BOOKING_SOURCE_LABELS: Record<BookingSource, string> = {
  platform: "Пора в Аргентину",
  tripster: "Tripster",
  viator: "Viator",
  getyourguide: "GetYourGuide",
  airbnb: "Airbnb Experiences",
  other: "Другая площадка",
};

export const TRIP_TASK_CATEGORY_LABELS: Record<TripTaskCategory, string> = {
  tickets: "Билеты и входы",
  accommodation: "Проживание",
  transport: "Трансфер и логистика",
  documents: "Документы и регистрация",
  communication: "Связь с клиентом",
  other: "Прочее",
};

export const TRIP_TASK_STATUS_LABELS: Record<TripTaskStatus, string> = {
  pending: "Ожидает",
  in_progress: "В работе",
  done: "Готово",
  blocked: "Заблокировано",
};
