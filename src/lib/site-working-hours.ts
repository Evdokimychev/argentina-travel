import { SITE_WORKING_HOURS } from "@/data/site-contacts";

export const SITE_WORK_TIMEZONE = "America/Argentina/Buenos_Aires";

const WORK_WEEKDAYS = new Set(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]);
const OPEN_MINUTES = 10 * 60;
const CLOSE_MINUTES = 18 * 60;

function getBuenosAiresTimeParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: SITE_WORK_TIMEZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const hour = Number(map.hour);
  const minute = Number(map.minute);

  return {
    weekday: map.weekday ?? "Sun",
    hour,
    minute,
    totalMinutes: hour * 60 + minute,
  };
}

export function isSiteTeamOnline(now = new Date()): boolean {
  const { weekday, totalMinutes } = getBuenosAiresTimeParts(now);
  if (!WORK_WEEKDAYS.has(weekday)) return false;
  return totalMinutes >= OPEN_MINUTES && totalMinutes < CLOSE_MINUTES;
}

export function formatBuenosAiresTime(now = new Date()): string {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: SITE_WORK_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
  }).format(now);
}

export function getSiteTeamAvailability(now = new Date()) {
  const online = isSiteTeamOnline(now);
  const localTime = formatBuenosAiresTime(now);

  if (online) {
    return {
      online: true,
      title: "Сейчас на связи",
      description: `Сейчас в Буэнос-Айресе ${localTime} — можем ответить в WhatsApp или Telegram`,
      scheduleNote: SITE_WORKING_HOURS,
    };
  }

  const { weekday } = getBuenosAiresTimeParts(now);
  const isSunday = weekday === "Sun";

  return {
    online: false,
    title: isSunday ? "Сегодня выходной" : "Сейчас отдыхаем",
    description: isSunday
      ? `Сейчас в Буэнос-Айресе ${localTime} — в воскресенье мы не на связи, но сообщение можно оставить`
      : `Сейчас в Буэнос-Айресе ${localTime} — у нас ночь, но сообщение можно оставить`,
    scheduleNote: SITE_WORKING_HOURS,
  };
}
