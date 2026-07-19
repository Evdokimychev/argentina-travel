import { CronExpressionParser } from "cron-parser";
import type { IngestionSourceRecord } from "@/types/ingestion";

export function nextSourceRunAt(source: Pick<IngestionSourceRecord, "enabled" | "scheduleKind" | "scheduleExpression">, from = new Date()): string | null {
  if (!source.enabled || source.scheduleKind === "manual" || source.scheduleKind === "webhook") return null;
  if (!source.scheduleExpression) return null;
  if (source.scheduleKind === "cron") return CronExpressionParser.parse(source.scheduleExpression, { currentDate: from, tz: "America/Argentina/Buenos_Aires" }).next().toISOString();
  const match = source.scheduleExpression.trim().match(/^(\d+)\s*(m|h|d)$/i);
  if (!match) throw new Error("INVALID_INTERVAL_EXPRESSION");
  const multiplier = match[2].toLowerCase() === "m" ? 60_000 : match[2].toLowerCase() === "h" ? 3_600_000 : 86_400_000;
  return new Date(from.getTime() + Number(match[1]) * multiplier).toISOString();
}
