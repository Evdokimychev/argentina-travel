import type { TripOperations } from "@/types/trip-operations";

/** Демо-чеклист для индивидуальной поездки на Игуасу с Tripster. */
export function buildTripsterIguazuDemoOperations(now: string): TripOperations {
  return {
    updatedAt: now,
    organizerNotes:
      "Клиенты прилетают 11.09 в IGR. Нужен ранний выезд к парку — уточнить завтрак в отеле.",
    tasks: [
      {
        id: "task-iguazu-1",
        title: "Подтвердить даты и время с клиентом",
        category: "communication",
        status: "done",
        clientVisible: false,
        completedAt: "2026-06-10T09:00:00.000Z",
        sortOrder: 0,
      },
      {
        id: "task-iguazu-2",
        title: "Собрать данные участников (паспорта, контакты)",
        category: "documents",
        status: "in_progress",
        clientVisible: true,
        sortOrder: 1,
      },
      {
        id: "task-iguazu-3",
        title: "Купить билеты в нацпарк (аргентинская сторона)",
        category: "tickets",
        status: "done",
        clientVisible: true,
        completedAt: "2026-06-12T14:30:00.000Z",
        dueDate: "2026-06-15",
        sortOrder: 2,
      },
      {
        id: "task-iguazu-4",
        title: "Оформить разрешение на бразильскую сторону",
        category: "documents",
        status: "pending",
        clientVisible: true,
        dueDate: "2026-09-01",
        sortOrder: 3,
      },
      {
        id: "task-iguazu-5",
        title: "Забронировать трансфер аэропорт — отель — парк",
        category: "transport",
        status: "in_progress",
        clientVisible: true,
        sortOrder: 4,
      },
      {
        id: "task-iguazu-6",
        title: "Отправить клиенту инструкции перед выездом",
        category: "communication",
        status: "pending",
        clientVisible: true,
        dueDate: "2026-09-10",
        sortOrder: 5,
      },
    ],
    resourceLinks: [
      {
        id: "link-iguazu-1",
        title: "Официальный сайт парка Игуасу (AR)",
        url: "https://www.argentina.gob.ar/interior/ambiente/parquesnacionales/iguazu",
        description: "Покупка билетов и правила посещения",
        clientVisible: true,
      },
      {
        id: "link-iguazu-2",
        title: "Форма данных участников",
        url: "/booking/travelers/trv-demo-tripster",
        description: "Заполните паспортные данные для регистрации группы",
        clientVisible: true,
      },
    ],
    clientRequirements: {
      flightArrival: "11.09.2026, рейс AR1734, прилёт ~10:40 IGR",
      hotelName: "Hotel Saint George",
      hotelAddress: "Av. Córdoba 148, Puerto Iguazú",
      hotelCheckIn: "2026-09-11",
      hotelCheckOut: "2026-09-13",
      dietaryRestrictions: "Без глютена у одного участника",
      submittedAt: "2026-06-11T16:20:00.000Z",
    },
  };
}
