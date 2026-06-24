import { addDays, format, subDays } from "date-fns";
import { ru } from "date-fns/locale";
import {
  resolveMeetingPointFlightDestination,
  type MeetingPointFlightDestination,
} from "@/lib/flights/meeting-point-flight";

export type TourFlightPrefillInput = {
  userOriginCode: string;
  startCity: string;
  finishCity?: string;
  tourStartDate?: Date;
  tourEndDate?: Date;
  startTime?: string;
  finishTime?: string;
};

export type TourFlightPrefillForm = {
  origin: string;
  destination: string;
  departDate?: Date;
  returnDate?: Date;
  returnOrigin?: string;
  returnDestination?: string;
};

export type TourFlightPrefillLeg = {
  kind: "outbound" | "return";
  label: string;
  origin: string;
  destination: string;
  departDate?: Date;
};

export type TourFlightSchedulePoint = {
  role: "start" | "finish";
  city: string;
  dateLabel?: string;
  timeLabel?: string;
};

/** Structured flight advice for one tour leg (outbound or return). */
export type TourFlightLegAdvice = {
  role: "outbound" | "return";
  city: string;
  tourDateLabel?: string;
  tourTimeLabel?: string;
  suggestedDepartDateLabel?: string;
  /** Короткая рекомендация по дате билета. */
  flightTip: string;
  /** Почему выбрана такая дата / на что обратить внимание. */
  reason: string;
};

export type TourFlightBriefing = {
  hasTourDates: boolean;
  schedule: {
    start: TourFlightSchedulePoint;
    finish: TourFlightSchedulePoint;
  };
  recommendations: {
    outboundDepartDate?: Date;
    returnDepartDate?: Date;
    daysBeforeTour: number;
    /** @deprecated use outbound/return blocks — kept for screen readers and legacy hints */
    summary: string;
    outboundLine?: string;
    returnLine?: string;
    outbound?: TourFlightLegAdvice;
    return?: TourFlightLegAdvice;
  };
  routeNote?: string;
};

export type TourFlightPrefillResult = {
  form: TourFlightPrefillForm;
  isOpenJaw: boolean;
  legs?: TourFlightPrefillLeg[];
  hints: string[];
  briefing: TourFlightBriefing;
  startDestination: MeetingPointFlightDestination;
  finishDestination: MeetingPointFlightDestination;
};

export type TourFlightFormConfig = {
  id: string;
  kind: "outbound" | "return" | "roundtrip";
  title: string;
  routePreset: { origin: string; destination: string };
  oneWay: boolean;
  initialDepartDate?: Date;
  initialReturnDate?: Date;
  dateHint?: string;
  searchLabel: string;
};

/** Сегменты для компактной формы сложного маршрута на странице тура. */
export type TourFlightFormSegment = {
  id: string;
  kind: "outbound" | "return" | "roundtrip";
  tabLabel?: string;
  origin: string;
  destination: string;
  departDate?: Date;
  returnDate?: Date;
};

const INTERCONTINENTAL_ORIGINS = new Set(["MOW", "LED", "SVX", "OVB", "IST", "MAD", "MIA"]);

const SOUTH_AMERICA_CODES = new Set([
  "BUE",
  "RIO",
  "SAO",
  "BSB",
  "SSA",
  "REC",
  "FOR",
  "SCL",
  "LIM",
  "BOG",
  "USH",
  "FTE",
  "BRC",
  "IGR",
  "MDZ",
  "SLA",
  "COR",
  "GRU",
]);

const ARGENTINA_DOMESTIC_CODES = new Set([
  "AFA",
  "BHI",
  "BRC",
  "CNQ",
  "COR",
  "CPC",
  "CRD",
  "CTC",
  "EQS",
  "FMA",
  "FTE",
  "IGR",
  "IRJ",
  "JUJ",
  "LUQ",
  "MDQ",
  "MDZ",
  "NQN",
  "PMY",
  "PRA",
  "PSS",
  "RCU",
  "REL",
  "RGA",
  "RGL",
  "RHD",
  "RLO",
  "ROS",
  "RSA",
  "SDE",
  "SFN",
  "SLA",
  "TUC",
  "UAQ",
  "USH",
  "VDM",
  "RES",
]);

function parseClockTime(value?: string): { hours: number; minutes: number } | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(trimmed);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return { hours, minutes };
}

function isEarlyStart(time?: string): boolean {
  const parsed = parseClockTime(time);
  return parsed != null && parsed.hours < 10;
}

export function resolveTravelDays(origin: string, destination: string): number {
  if (INTERCONTINENTAL_ORIGINS.has(origin) && SOUTH_AMERICA_CODES.has(destination)) {
    return 2;
  }
  if (origin === "BUE" && ARGENTINA_DOMESTIC_CODES.has(destination)) {
    return 0;
  }
  if (
    SOUTH_AMERICA_CODES.has(origin) &&
    SOUTH_AMERICA_CODES.has(destination) &&
    origin !== destination
  ) {
    return 1;
  }
  if (origin === destination) return 0;
  if (INTERCONTINENTAL_ORIGINS.has(origin)) return 2;
  return 1;
}

function formatTourDateLong(date: Date): string {
  return format(date, "d MMMM yyyy", { locale: ru });
}

function formatTourDate(date: Date): string {
  return format(date, "d MMMM", { locale: ru });
}

function formatTimeLabel(time: string | undefined, role: "start" | "finish"): string | undefined {
  const trimmed = time?.trim();
  if (!trimmed) return undefined;
  return role === "start" ? `с ${trimmed}` : `до ${trimmed}`;
}

function buildSchedulePoint(
  role: "start" | "finish",
  city: string,
  date?: Date,
  time?: string,
): TourFlightSchedulePoint {
  return {
    role,
    city,
    dateLabel: date ? formatTourDateLong(date) : undefined,
    timeLabel: formatTimeLabel(time, role),
  };
}

function pluralDays(count: number): string {
  if (count === 1) return "1 день";
  if (count >= 5) return `${count} дней`;
  return `${count} дня`;
}

function buildOutboundReason(
  travelDays: number,
  outboundBuffer: number,
  earlyStart: boolean,
): string {
  if (travelDays >= 2) {
    let reason =
      `Межконтинентальный перелёт обычно занимает 1–2 дня с пересадками. ` +
      `Запас ${pluralDays(outboundBuffer)} до старта — чтобы успеть долететь и отдохнуть перед туром.`;
    if (earlyStart) {
      reason += " Старт тура рано утром — добавили ещё один день на дорогу.";
    }
    return reason;
  }
  if (travelDays === 1) {
    return "Региональный перелёт — рекомендуем вылет за 1 день до начала тура.";
  }
  return "Короткий перелёт — можно прилететь накануне или в день старта, если рейс утренний.";
}

function buildReturnReason(
  tourEndDate: Date,
  finishTime: string | undefined,
  returnDate: Date,
  finishCity: string,
): string {
  const finishWhen = [
    formatTourDateLong(tourEndDate),
    finishTime ? `до ${finishTime}` : null,
    finishCity,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    `Тур заканчивается ${finishWhen}. ` +
    `Рекомендуем улететь ${formatTourDateLong(returnDate)} — на следующий день после финиша, ` +
    `чтобы был запас на дорогу в аэропорт и сдачу багажа.`
  );
}

function buildBriefingWithoutDates(
  startDestination: MeetingPointFlightDestination,
  finishDestination: MeetingPointFlightDestination,
  isOpenJaw: boolean,
): TourFlightBriefing {
  const outboundReason =
    "Межконтинентальный перелёт обычно требует запас 1–2 дня до старта. После выбора заезда подставим дату вылета автоматически.";

  return {
    hasTourDates: false,
    schedule: {
      start: buildSchedulePoint("start", startDestination.label),
      finish: buildSchedulePoint("finish", finishDestination.label),
    },
    recommendations: {
      daysBeforeTour: 2,
      summary:
        "Выберите заезд тура в блоке бронирования — мы подставим даты и подскажем, когда вылетать. Или укажите даты вручную в форме ниже.",
      outbound: {
        role: "outbound",
        city: startDestination.label,
        flightTip: "Дата вылета появится после выбора заезда тура.",
        reason: outboundReason,
      },
      return: {
        role: "return",
        city: finishDestination.label,
        flightTip: isOpenJaw
          ? `Обратный рейс — из ${finishDestination.label}, не из города старта.`
          : "Дата обратного вылета появится после выбора заезда.",
        reason: "Рекомендуем планировать обратный вылет на день после окончания тура — так останется запас времени.",
      },
    },
    routeNote: isOpenJaw
      ? `Тур начинается в ${startDestination.label}, а заканчивается в ${finishDestination.label} — в форме ниже два перелёта: туда и обратно.`
      : undefined,
  };
}

function buildBriefingWithDates(input: {
  tourStartDate: Date;
  tourEndDate?: Date;
  startTime?: string;
  finishTime?: string;
  startDestination: MeetingPointFlightDestination;
  finishDestination: MeetingPointFlightDestination;
  isOpenJaw: boolean;
  userOriginCode: string;
  departDate: Date;
  returnDate?: Date;
  outboundBuffer: number;
  earlyStart: boolean;
}): TourFlightBriefing {
  const {
    tourStartDate,
    tourEndDate,
    startTime,
    finishTime,
    startDestination,
    finishDestination,
    isOpenJaw,
    departDate,
    returnDate,
    outboundBuffer,
    earlyStart,
  } = input;

  const startSchedule = buildSchedulePoint(
    "start",
    startDestination.label,
    tourStartDate,
    startTime,
  );
  const finishSchedule = buildSchedulePoint(
    "finish",
    finishDestination.label,
    tourEndDate,
    finishTime,
  );

  const daysWord =
    outboundBuffer === 1 ? "1 день" : outboundBuffer >= 5 ? `${outboundBuffer} дней` : `${outboundBuffer} дня`;

  const startWhen = [
    formatTourDateLong(tourStartDate),
    startTime ? `с ${startTime}` : null,
    startDestination.label,
  ]
    .filter(Boolean)
    .join(", ");

  let summary = `Старт тура — ${startWhen}. Межконтинентальный перелёт обычно занимает 1–2 дня, поэтому рекомендуем вылететь ${formatTourDateLong(departDate)} — за ${daysWord} до начала.`;

  if (earlyStart) {
    summary += " Старт рано утром — заложили дополнительный день на дорогу.";
  }

  const outboundLine = `Туда: вылет ${formatTourDateLong(departDate)} → нужно быть в ${startDestination.label} к началу тура.`;

  let returnLine: string | undefined;
  let returnAdvice: TourFlightLegAdvice | undefined;

  if (returnDate && tourEndDate) {
    const finishWhen = [
      formatTourDateLong(tourEndDate),
      finishTime ? `до ${finishTime}` : null,
      finishDestination.label,
    ]
      .filter(Boolean)
      .join(", ");

    returnLine = isOpenJaw
      ? `Обратно: тур заканчивается (${finishWhen}). Ищите билеты из ${finishDestination.label} на ${formatTourDateLong(returnDate)}.`
      : `Обратно: тур заканчивается (${finishWhen}). Вылет ${formatTourDateLong(returnDate)} из ${finishDestination.label}.`;

    returnAdvice = {
      role: "return",
      city: finishDestination.label,
      tourDateLabel: finishSchedule.dateLabel,
      tourTimeLabel: finishSchedule.timeLabel,
      suggestedDepartDateLabel: formatTourDateLong(returnDate),
      flightTip: `Рекомендуем вылет ${formatTourDateLong(returnDate)} из ${finishDestination.label} — на следующий день после финиша.`,
      reason: buildReturnReason(
        tourEndDate,
        finishTime,
        returnDate,
        finishDestination.label,
      ),
    };
  } else if (tourEndDate) {
    const suggestedReturn = addDays(tourEndDate, 1);
    returnAdvice = {
      role: "return",
      city: finishDestination.label,
      tourDateLabel: finishSchedule.dateLabel,
      tourTimeLabel: finishSchedule.timeLabel,
      flightTip: "Укажите дату обратного вылета в форме поиска.",
      reason: buildReturnReason(
        tourEndDate,
        finishTime,
        suggestedReturn,
        finishDestination.label,
      ),
    };
  }

  const outboundAdvice: TourFlightLegAdvice = {
    role: "outbound",
    city: startDestination.label,
    tourDateLabel: startSchedule.dateLabel,
    tourTimeLabel: startSchedule.timeLabel,
    suggestedDepartDateLabel: formatTourDateLong(departDate),
    flightTip: `Рекомендуем вылет ${formatTourDateLong(departDate)} — за ${daysWord} до старта.`,
    reason: buildOutboundReason(
      resolveTravelDays(input.userOriginCode, startDestination.code),
      outboundBuffer,
      earlyStart,
    ),
  };

  return {
    hasTourDates: true,
    schedule: { start: startSchedule, finish: finishSchedule },
    recommendations: {
      outboundDepartDate: departDate,
      returnDepartDate: returnDate,
      daysBeforeTour: outboundBuffer,
      summary,
      outboundLine,
      returnLine,
      outbound: outboundAdvice,
      return: returnAdvice,
    },
    routeNote: isOpenJaw
      ? `Прилёт в ${startDestination.label}, домой — из ${finishDestination.label}. Оба перелёта в одной форме ниже.`
      : undefined,
  };
}

export function resolveTourFlightFormSegments(
  prefill: TourFlightPrefillResult,
): TourFlightFormSegment[] {
  if (prefill.isOpenJaw && prefill.legs?.length) {
    return prefill.legs.map((leg) => ({
      id: leg.kind,
      kind: leg.kind,
      tabLabel: leg.kind === "outbound" ? "Туда" : "Обратно",
      origin: leg.origin,
      destination: leg.destination,
      departDate: leg.departDate,
    }));
  }

  return [
    {
      id: "roundtrip",
      kind: "roundtrip",
      origin: prefill.form.origin,
      destination: prefill.form.destination,
      departDate: prefill.form.departDate,
      returnDate: prefill.form.returnDate,
    },
  ];
}

export function resolveTourFlightFormConfigs(
  prefill: TourFlightPrefillResult,
): TourFlightFormConfig[] {
  if (prefill.isOpenJaw && prefill.legs?.length) {
    return prefill.legs.map((leg) => ({
      id: leg.kind,
      kind: leg.kind,
      title: leg.kind === "outbound" ? "Билеты туда" : "Билеты обратно",
      routePreset: { origin: leg.origin, destination: leg.destination },
      oneWay: true,
      initialDepartDate: leg.departDate,
      dateHint:
        leg.kind === "outbound"
          ? prefill.briefing.recommendations.outboundLine
          : prefill.briefing.recommendations.returnLine,
      searchLabel: leg.kind === "outbound" ? "Проверить билеты туда" : "Проверить билеты обратно",
    }));
  }

  return [
    {
      id: "roundtrip",
      kind: "roundtrip",
      title: "Билеты туда и обратно",
      routePreset: {
        origin: prefill.form.origin,
        destination: prefill.form.destination,
      },
      oneWay: false,
      initialDepartDate: prefill.form.departDate,
      initialReturnDate: prefill.form.returnDate,
      dateHint: prefill.briefing.recommendations.outboundLine,
      searchLabel: "Проверить билеты",
    },
  ];
}

function buildOutboundHint(
  departDate: Date,
  startDestination: MeetingPointFlightDestination,
  tourStartDate: Date,
  travelDays: number,
  earlyStart: boolean,
): string {
  const daysLabel =
    travelDays + (earlyStart ? 1 : 0) === 1 ? "1 день" : `${travelDays + (earlyStart ? 1 : 0)} дня`;
  return `Вылет за ${daysLabel} до старта тура, чтобы успеть в ${startDestination.label} к ${formatTourDate(tourStartDate)}`;
}

function buildReturnHint(
  returnDate: Date,
  finishDestination: MeetingPointFlightDestination,
): string {
  return `Обратный вылет ${formatTourDate(returnDate)} из ${finishDestination.label} — на следующий день после финиша тура`;
}

export function resolveTourFlightPrefill(input: TourFlightPrefillInput): TourFlightPrefillResult {
  const startDestination = resolveMeetingPointFlightDestination(input.startCity);
  const finishCity = input.finishCity?.trim() || input.startCity;
  const finishDestination = resolveMeetingPointFlightDestination(finishCity);
  const isOpenJaw = startDestination.code !== finishDestination.code;

  if (!input.tourStartDate) {
    const hints: string[] = [];
    if (isOpenJaw) {
      hints.push(
        `Маршрут open-jaw: прилёт в ${startDestination.label}, обратно из ${finishDestination.label}`,
      );
    }

    const legs: TourFlightPrefillLeg[] | undefined = isOpenJaw
      ? [
          {
            kind: "outbound",
            label: startDestination.label,
            origin: input.userOriginCode,
            destination: startDestination.code,
          },
          {
            kind: "return",
            label: finishDestination.label,
            origin: finishDestination.code,
            destination: input.userOriginCode,
          },
        ]
      : undefined;

    return {
      form: {
        origin: input.userOriginCode,
        destination: startDestination.code,
        returnOrigin: isOpenJaw ? finishDestination.code : undefined,
        returnDestination: isOpenJaw ? input.userOriginCode : undefined,
      },
      isOpenJaw,
      legs,
      hints,
      briefing: buildBriefingWithoutDates(startDestination, finishDestination, isOpenJaw),
      startDestination,
      finishDestination,
    };
  }

  const travelDays = resolveTravelDays(input.userOriginCode, startDestination.code);
  const earlyStart = isEarlyStart(input.startTime);

  const outboundBuffer = travelDays + (earlyStart ? 1 : 0);
  const departDate = subDays(input.tourStartDate, outboundBuffer);

  const returnDate = input.tourEndDate ? addDays(input.tourEndDate, 1) : undefined;

  const hints: string[] = [
    buildOutboundHint(departDate, startDestination, input.tourStartDate, travelDays, earlyStart),
  ];

  if (returnDate) {
    hints.push(buildReturnHint(returnDate, finishDestination));
  }

  if (isOpenJaw) {
    hints.push(
      `Маршрут open-jaw: прилёт в ${startDestination.label}, обратно из ${finishDestination.label}`,
    );
  }

  const form: TourFlightPrefillForm = {
    origin: input.userOriginCode,
    destination: startDestination.code,
    departDate,
    returnDate,
    returnOrigin: isOpenJaw ? finishDestination.code : undefined,
    returnDestination: isOpenJaw ? input.userOriginCode : undefined,
  };

  const legs: TourFlightPrefillLeg[] | undefined = isOpenJaw
    ? [
        {
          kind: "outbound",
          label: startDestination.label,
          origin: input.userOriginCode,
          destination: startDestination.code,
          departDate,
        },
        ...(returnDate
          ? [
              {
                kind: "return" as const,
                label: finishDestination.label,
                origin: finishDestination.code,
                destination: input.userOriginCode,
                departDate: returnDate,
              },
            ]
          : []),
      ]
    : undefined;

  return {
    form,
    isOpenJaw,
    legs,
    hints,
    briefing: buildBriefingWithDates({
      tourStartDate: input.tourStartDate,
      tourEndDate: input.tourEndDate,
      startTime: input.startTime,
      finishTime: input.finishTime,
      startDestination,
      finishDestination,
      isOpenJaw,
      userOriginCode: input.userOriginCode,
      departDate,
      returnDate,
      outboundBuffer,
      earlyStart,
    }),
    startDestination,
    finishDestination,
  };
}
