import { NextResponse } from "next/server";
import { parseExcursionSlug } from "@/lib/excursion-slug";
import { parseExcursionSchedule } from "@/lib/excursion-schedule";
import { fetchExcursionDetailServer } from "@/lib/excursion-server";
import { fetchTripsterSchedule, TripsterBookingError } from "@/lib/tripster/booking-api";
import { isTripsterConfigured } from "@/lib/tripster/env";
import {
  fetchSputnik8ProductSchedule,
  Sputnik8BookingError,
} from "@/lib/sputnik8/booking-api";
import { isSputnik8Configured } from "@/lib/sputnik8/env";

type RouteContext = { params: Promise<{ slug: string }> };

function dateRange(from: string, to: string, limit = 366): string[] {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) return [];
  const start = new Date(`${from}T12:00:00Z`);
  const end = new Date(`${to}T12:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return [];

  const result: string[] = [];
  for (let cursor = start; cursor <= end && result.length < limit; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    result.push(cursor.toISOString().slice(0, 10));
  }
  return result;
}

function buildPlatformSchedule(excursion: NonNullable<Awaited<ReturnType<typeof fetchExcursionDetailServer>>>) {
  const today = new Date().toISOString().slice(0, 10);
  const startTime = excursion.platformStartTime || "10:00";
  const timeEnd = excursion.platformEndTime || undefined;
  const scheduled = (excursion.platformDates ?? [])
    .filter((date) => date.startDate >= today && date.spotsLeft > 0)
    .map((date) => ({
      date: date.startDate,
      slots: [{ time: startTime, timeEnd, priceValue: date.priceUsd || excursion.priceValue }],
    }));

  if (scheduled.length > 0 || excursion.platformBookingMode === "scheduled") {
    return { dates: scheduled, maxPersons: excursion.maxPersons };
  }

  const from = [excursion.platformRequestDateFrom, today]
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1);
  const fallbackTo = new Date(`${today}T12:00:00Z`);
  fallbackTo.setUTCDate(fallbackTo.getUTCDate() + 90);
  const to = excursion.platformRequestDateTo || fallbackTo.toISOString().slice(0, 10);
  const requested = from && to
    ? dateRange(from, to).map((date) => ({
        date,
        slots: [{ time: startTime, timeEnd, priceValue: excursion.priceValue }],
      }))
    : [];
  return { dates: requested, maxPersons: excursion.maxPersons };
}

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const excursion = await fetchExcursionDetailServer(slug);
  if (!excursion) {
    return NextResponse.json({ error: "Excursion not found." }, { status: 404 });
  }

  if (excursion.partner === "platform") {
    return NextResponse.json(buildPlatformSchedule(excursion));
  }

  const parsed = parseExcursionSlug(slug);

  if (parsed?.partner === "sputnik8" || excursion.partner === "sputnik8") {
    if (!isSputnik8Configured()) {
      return NextResponse.json({
        dates: [],
        affiliateFallback: `/api/affiliate/go/${slug}`,
      });
    }

    try {
      const schedule = await fetchSputnik8ProductSchedule(excursion.id);
      return NextResponse.json(schedule);
    } catch (error) {
      const status = error instanceof Sputnik8BookingError ? error.status : 502;
      if (status === 401 || status === 403 || status === 503) {
        return NextResponse.json({
          dates: [],
          affiliateFallback: `/api/affiliate/go/${slug}`,
        });
      }
      return NextResponse.json(
        { error: "Failed to load schedule." },
        { status: status >= 400 && status < 600 ? status : 502 }
      );
    }
  }

  if (!isTripsterConfigured()) {
    return NextResponse.json({ error: "Tripster is not configured." }, { status: 503 });
  }

  try {
    const schedule = await fetchTripsterSchedule(excursion.id);
    return NextResponse.json(parseExcursionSchedule(schedule));
  } catch (error) {
    const status = error instanceof TripsterBookingError ? error.status : 502;
    return NextResponse.json(
      { error: "Failed to load schedule." },
      { status: status >= 400 && status < 600 ? status : 502 }
    );
  }
}
