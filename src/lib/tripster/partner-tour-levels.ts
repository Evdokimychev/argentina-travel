import { htmlToPlainText } from "@/lib/rich-text";
import { parseOrgDetailsAccordionHtml } from "@/lib/tripster/partner-tour-content";
import type { TripsterExperience } from "@/lib/tripster/types";
import type { ComfortLevel, DifficultyLevel } from "@/types";

const EXTREME_PATTERNS = [/восхожден/i, /альпин/i, /конкаг/i, /экстрем/i, /climb/i];
const HIGH_PATTERNS = [/треккинг/i, /trek/i, /поход/i, /горн/i, /активн/i, /hiking/i];
const LIGHT_PATTERNS = [/спокойн/i, /неспеш/i, /ознаком/i, /экскур/i, /leisure/i];

function buildTripsterMetadataHaystack(experience: TripsterExperience): string {
  return [
    experience.title,
    experience.tagline,
    experience.format,
    experience.movement_type,
    experience.comfort_level_info,
    ...(experience.tags?.map((tag) => tag.name) ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function inferDifficultyFromMetadata(experience: TripsterExperience): DifficultyLevel | undefined {
  const haystack = buildTripsterMetadataHaystack(experience);
  if (EXTREME_PATTERNS.some((pattern) => pattern.test(haystack))) return "Экстремальная";
  if (HIGH_PATTERNS.some((pattern) => pattern.test(haystack))) return "Высокая";
  if (LIGHT_PATTERNS.some((pattern) => pattern.test(haystack))) return "Лёгкая";
  return undefined;
}

const GRADE_TO_DIFFICULTY: Record<number, DifficultyLevel> = {
  1: "Лёгкая",
  2: "Лёгкая",
  3: "Умеренная",
  4: "Высокая",
  5: "Экстремальная",
};

function inferDifficultyFromText(text: string): DifficultyLevel | undefined {
  const normalized = text.toLowerCase();
  if (/экстрем|экспедиц|альпин/.test(normalized)) return "Экстремальная";
  if (/высок|интенсив|трекинг|треккинг|поход|сложн|напряж/.test(normalized)) return "Высокая";
  if (/умерен|средн/.test(normalized)) return "Умеренная";
  if (/лёгк|легк|спокойн|минимальн/.test(normalized)) return "Лёгкая";
  return undefined;
}

function resolveTripsterGrade(experience: TripsterExperience): number | undefined {
  const gradeRaw = (experience as TripsterExperience & { grade?: unknown }).grade;
  const parsed = typeof gradeRaw === "number" ? gradeRaw : Number.parseInt(String(gradeRaw ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 5) return undefined;
  return parsed;
}

function resolveDifficultyFromComfortInfo(comfortInfo: string): DifficultyLevel | undefined {
  const parsed = parseOrgDetailsAccordionHtml(comfortInfo);
  const difficultyItem = parsed.items.find((item) => /сложност|уровень/i.test(item.title));
  if (difficultyItem) {
    const fromItem = inferDifficultyFromText(htmlToPlainText(difficultyItem.html));
    if (fromItem) return fromItem;
  }

  return inferDifficultyFromText(htmlToPlainText(comfortInfo));
}

/** Maps Tripster payload fields to catalog difficulty (grade, comfort_level_info, program blocks). */
export function resolveTripsterDifficultyLevelFromPayload(
  experience: TripsterExperience
): DifficultyLevel {
  const grade = resolveTripsterGrade(experience);
  if (grade != null) {
    return GRADE_TO_DIFFICULTY[grade] ?? "Умеренная";
  }

  const comfortInfo = experience.comfort_level_info?.trim();
  if (comfortInfo) {
    const fromComfort = resolveDifficultyFromComfortInfo(comfortInfo);
    if (fromComfort) return fromComfort;
  }

  for (const block of experience.description_blocks ?? []) {
    if (!Array.isArray(block)) continue;
    const title = String(block[0] ?? "");
    if (!/сложност|уровень/i.test(title)) continue;
    const fromBlock = inferDifficultyFromText(htmlToPlainText(String(block[1] ?? "")));
    if (fromBlock) return fromBlock;
  }

  return inferDifficultyFromMetadata(experience) ?? "Умеренная";
}

export function resolveTripsterComfortLevel(experience: TripsterExperience): ComfortLevel {
  const haystack = buildTripsterMetadataHaystack(experience);

  if (/люкс|5\s*\*|премиум|бутик|unique/i.test(haystack)) return "Премиум";
  if (/4\s*\*|комфорт|comfort/i.test(haystack)) return "Комфорт";
  if (/палат|кемпинг|кемп|базов|hostel|хостел/i.test(haystack)) return "Базовый";

  return "Стандарт";
}

export function resolveTripsterInstantBooking(experience: TripsterExperience): boolean {
  return Boolean(experience.instant_booking);
}

export function resolveTripsterThematicTags(experience: TripsterExperience): string[] {
  const tags = (experience.tags ?? [])
    .map((tag) => tag.name?.trim())
    .filter((name): name is string => Boolean(name));

  return [...new Set(tags)].slice(0, 4);
}
