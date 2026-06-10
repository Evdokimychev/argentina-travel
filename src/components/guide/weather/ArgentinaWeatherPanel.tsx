"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  CalendarDays,
  CloudSun,
  Droplets,
  LayoutGrid,
  MapPin,
  RefreshCw,
  Star,
  Thermometer,
} from "lucide-react";
import {
  ARGENTINA_CLIMATE_REGIONS,
  getClimateMonths,
  getClimateRegion,
  type ArgentinaClimateMonth,
} from "@/data/argentina-climate";
import {
  getClimateMonthImage,
  type ClimateViewMode,
} from "@/data/argentina-climate-images";
import { fetchArgentinaWeatherForecast, type WeatherDayForecast } from "@/lib/argentina-weather-api";
import { cn } from "@/lib/cn";

function travelScoreLabel(score: ArgentinaClimateMonth["travelScore"]): string {
  if (score === 3) return "Лучший сезон";
  if (score === 2) return "Хорошо";
  return "Низкий сезон";
}

function travelScoreClass(score: ArgentinaClimateMonth["travelScore"]): string {
  if (score === 3) return "bg-emerald-500/15 text-emerald-700 ring-emerald-500/20";
  if (score === 2) return "bg-sky/10 text-sky ring-sky/20";
  return "bg-gray-100 text-slate ring-gray-200";
}

function travelScoreBarClass(score: ArgentinaClimateMonth["travelScore"]): string {
  if (score === 3) return "bg-emerald-500";
  if (score === 2) return "bg-sky";
  return "bg-gray-300";
}

function MonthCard({
  month,
  isCurrent,
  tempScale,
  imageSrc,
}: {
  month: ArgentinaClimateMonth;
  isCurrent: boolean;
  tempScale: { min: number; max: number };
  imageSrc: string;
}) {
  const range = tempScale.max - tempScale.min || 1;
  const lowPct = ((month.lowC - tempScale.min) / range) * 100;
  const highPct = ((month.highC - tempScale.min) / range) * 100;
  const barBottom = Math.min(lowPct, highPct);
  const barHeight = Math.max(highPct - lowPct, 8);

  return (
    <article
      className={cn(
        "group relative flex min-h-[11rem] flex-col overflow-hidden rounded-2xl border transition-all",
        isCurrent
          ? "border-sky/40 shadow-md ring-1 ring-sky/20"
          : "border-gray-100 hover:border-sky/25 hover:shadow-sm"
      )}
    >
      <Image
        src={imageSrc}
        alt=""
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-105"
        sizes="(max-width: 640px) 50vw, 25vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-white via-white/92 to-white/55" aria-hidden />

      <div className="relative z-10 flex flex-1 flex-col p-3 sm:p-4">
        {isCurrent ? (
          <span className="absolute -top-0 right-3 rounded-full bg-sky px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm">
            Сейчас
          </span>
        ) : null}
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-display text-sm font-bold text-charcoal">{month.labelShort}</p>
            <p className="text-[11px] text-slate">{month.label}</p>
          </div>
          <span className="text-xl drop-shadow-sm" aria-hidden>
            {month.emoji}
          </span>
        </div>

        <div className="mt-auto flex items-end gap-3 pt-3">
          <div className="relative h-16 w-3 shrink-0 rounded-full bg-charcoal/5">
            <div
              className="absolute left-0 right-0 rounded-full bg-gradient-to-t from-sky to-sky/60"
              style={{ bottom: `${barBottom}%`, height: `${barHeight}%` }}
              aria-hidden
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg font-bold tabular-nums text-charcoal">
              {month.highC}°
              <span className="text-sm font-normal text-slate"> / {month.lowC}°</span>
            </p>
            <p className="mt-0.5 text-xs text-slate">{month.condition}</p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 text-[11px] text-slate shadow-sm">
            <Droplets className="h-3 w-3" aria-hidden />
            {month.rainMm} мм
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 text-[11px] text-slate shadow-sm">
            {month.rainDays} дн. дождя
          </span>
        </div>

        <span
          className={cn(
            "mt-3 inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
            travelScoreClass(month.travelScore)
          )}
        >
          <Star className="h-3 w-3" aria-hidden />
          {travelScoreLabel(month.travelScore)}
        </span>
      </div>
    </article>
  );
}

function ClimateScheduleView({
  months,
  currentMonth,
  tempScale,
}: {
  months: ArgentinaClimateMonth[];
  currentMonth: number;
  tempScale: { min: number; max: number };
}) {
  const range = tempScale.max - tempScale.min || 1;
  const midTemp = Math.round((tempScale.max + tempScale.min) / 2);
  const chartHeightClass = "h-36 sm:h-44 md:h-48";
  const columnGap = "gap-1 sm:gap-1.5";

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white/80 p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate">
          Температура по месяцам
        </p>
        <p className="text-[10px] text-slate">
          <span className="text-charcoal/70">▬</span> диапазон max / min
        </p>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="min-w-[36rem]">
          {/* Chart + aligned data share the same 12-column grid */}
          <div className="flex">
            <div
              className={cn(
                "flex w-7 shrink-0 flex-col justify-between py-0.5 pr-1 text-right",
                chartHeightClass
              )}
              aria-hidden
            >
              <span className="text-[10px] font-medium tabular-nums text-slate">{tempScale.max}°</span>
              <span className="text-[10px] tabular-nums text-slate/60">{midTemp}°</span>
              <span className="text-[10px] font-medium tabular-nums text-slate">{tempScale.min}°</span>
            </div>

            <div className="min-w-0 flex-1">
              <div className={cn("relative flex items-stretch", columnGap, chartHeightClass)}>
                <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="border-t border-dashed border-gray-100" />
                  ))}
                </div>
                {months.map((month) => {
                  const lowPct = ((month.lowC - tempScale.min) / range) * 100;
                  const highPct = ((month.highC - tempScale.min) / range) * 100;
                  const barBottom = Math.min(lowPct, highPct);
                  const barHeight = Math.max(highPct - lowPct, 8);
                  const isCurrent = month.month === currentMonth;

                  return (
                    <div
                      key={month.month}
                      className={cn(
                        "relative z-10 flex min-w-0 flex-1 justify-center",
                        isCurrent && "rounded-t-lg bg-sky/[0.06]"
                      )}
                      title={`${month.label}: ${month.highC}° / ${month.lowC}°`}
                    >
                      <div className="relative h-full w-full max-w-[2.75rem] rounded-t-md bg-charcoal/[0.04]">
                        <div
                          className={cn(
                            "absolute left-1/2 w-2.5 -translate-x-1/2 rounded-full sm:w-3",
                            travelScoreBarClass(month.travelScore),
                            isCurrent && "ring-2 ring-sky ring-offset-1"
                          )}
                          style={{ bottom: `${barBottom}%`, height: `${barHeight}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className={cn("mt-1.5 flex", columnGap)}>
                {months.map((month) => {
                  const isCurrent = month.month === currentMonth;
                  return (
                    <div
                      key={month.month}
                      className={cn(
                        "min-w-0 flex-1 text-center",
                        isCurrent && "rounded-b-lg bg-sky/[0.06] pb-0.5"
                      )}
                    >
                      <span
                        className={cn(
                          "text-[10px] font-medium leading-none sm:text-[11px]",
                          isCurrent ? "font-bold text-sky" : "text-slate"
                        )}
                      >
                        {month.labelShort}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Data rows — columns aligned with chart above */}
          <div className="mt-3 border-t border-gray-100 pt-3">
            {(
              [
                {
                  key: "temp",
                  label: "Темп.",
                  render: (m: ArgentinaClimateMonth) => (
                    <span className="font-display text-[10px] font-bold tabular-nums leading-tight text-charcoal sm:text-[11px]">
                      {m.highC}°
                      <span className="font-normal text-slate">/{m.lowC}°</span>
                    </span>
                  ),
                },
                {
                  key: "rain",
                  label: "Осадки",
                  render: (m: ArgentinaClimateMonth) => (
                    <span className="text-[10px] tabular-nums text-slate sm:text-[11px]">{m.rainMm} мм</span>
                  ),
                },
                {
                  key: "days",
                  label: "Дождь",
                  render: (m: ArgentinaClimateMonth) => (
                    <span className="text-[10px] tabular-nums text-slate sm:text-[11px]">{m.rainDays} дн.</span>
                  ),
                },
                {
                  key: "season",
                  label: "Сезон",
                  render: (m: ArgentinaClimateMonth) => (
                    <span
                      className={cn(
                        "inline-block max-w-full truncate rounded-full px-1.5 py-0.5 text-[9px] font-medium ring-1 ring-inset sm:text-[10px]",
                        travelScoreClass(m.travelScore)
                      )}
                    >
                      {travelScoreLabel(m.travelScore)}
                    </span>
                  ),
                },
              ] as const
            ).map((row) => (
              <div key={row.key} className="flex items-stretch py-1.5 first:pt-0 last:pb-0">
                <div className="flex w-7 shrink-0 items-center justify-end pr-1">
                  <span className="text-[9px] font-semibold uppercase leading-tight tracking-wide text-slate sm:text-[10px]">
                    {row.label}
                  </span>
                </div>
                <div className={cn("flex min-w-0 flex-1", columnGap)}>
                  {months.map((month) => {
                    const isCurrent = month.month === currentMonth;
                    return (
                      <div
                        key={month.month}
                        className={cn(
                          "flex min-w-0 flex-1 items-center justify-center text-center",
                          isCurrent && "rounded-md bg-sky/[0.06]"
                        )}
                      >
                        {row.render(month)}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ForecastDayCompact({
  day,
  highlight,
}: {
  day: WeatherDayForecast;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 flex-col rounded-xl border px-3 py-2.5 sm:flex-row sm:items-center sm:gap-3 sm:px-4 sm:py-3",
        highlight
          ? "border-sky/30 bg-sky/5"
          : "border-gray-100/80 bg-white/70"
      )}
    >
      <div className="flex items-center gap-2 sm:min-w-[5.5rem]">
        <span className="text-xl sm:text-2xl" aria-hidden>
          {day.presentation.emoji}
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate">{day.label}</p>
          <p className="text-[10px] tabular-nums text-slate sm:text-[11px]">
            {new Date(day.date + "T12:00:00").toLocaleDateString("ru-RU", {
              weekday: "short",
              day: "numeric",
              month: "short",
            })}
          </p>
        </div>
      </div>
      <p className="mt-1 font-display text-base font-bold tabular-nums text-charcoal sm:mt-0 sm:min-w-[4.5rem]">
        {day.highC}°
        <span className="text-sm font-normal text-slate"> / {day.lowC}°</span>
      </p>
      <p className="mt-0.5 min-w-0 flex-1 truncate text-xs text-slate sm:mt-0">
        {day.presentation.label}
        {day.precipitationMm > 0 ? (
          <span className="text-sky"> · {day.precipitationMm.toFixed(1)} мм</span>
        ) : null}
      </p>
    </div>
  );
}

function ForecastCompactStrip({
  regionShortName,
  forecast,
  loading,
  error,
  onRefresh,
}: {
  regionShortName: string;
  forecast: WeatherDayForecast[] | null;
  loading: boolean;
  error: boolean;
  onRefresh: () => void;
}) {
  return (
    <section
      aria-label="Прогноз на три дня"
      className="rounded-2xl border border-sky/15 bg-gradient-to-r from-sky/5 via-white to-white p-3 shadow-sm sm:p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs font-medium text-charcoal sm:text-sm">
          <MapPin className="h-3.5 w-3.5 text-sky" aria-hidden />
          Прогноз · {regionShortName}
          <span className="hidden font-normal text-slate sm:inline">— вчера, сегодня, завтра</span>
        </p>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-slate transition-colors hover:border-sky/30 hover:text-sky disabled:opacity-50"
          aria-label="Обновить прогноз"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
        </button>
      </div>

      <div className="mt-2.5">
        {loading ? (
          <div className="grid gap-2 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100 sm:h-14" />
            ))}
          </div>
        ) : null}
        {!loading && error ? (
          <p className="text-xs text-amber-700">Не удалось загрузить прогноз.</p>
        ) : null}
        {!loading && forecast ? (
          <div className="grid gap-2 sm:grid-cols-3">
            {forecast.map((day, index) => (
              <ForecastDayCompact key={day.date} day={day} highlight={index === 1} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default function ArgentinaWeatherPanel() {
  const [regionId, setRegionId] = useState("ba");
  const [viewMode, setViewMode] = useState<ClimateViewMode>("cards");
  const [forecast, setForecast] = useState<WeatherDayForecast[] | null>(null);
  const [forecastLoading, setForecastLoading] = useState(true);
  const [forecastError, setForecastError] = useState(false);

  const region = getClimateRegion(regionId);
  const months = getClimateMonths(regionId);
  const currentMonth = new Date().getMonth() + 1;

  const tempScale = useMemo(() => {
    const lows = months.map((m) => m.lowC);
    const highs = months.map((m) => m.highC);
    return {
      min: Math.min(...lows) - 2,
      max: Math.max(...highs) + 2,
    };
  }, [months]);

  const loadForecast = useCallback(async () => {
    setForecastLoading(true);
    setForecastError(false);
    try {
      const result = await fetchArgentinaWeatherForecast({
        regionId: region.id,
        latitude: region.latitude,
        longitude: region.longitude,
        timezone: region.timezone,
      });
      setForecast(result.days);
    } catch {
      setForecastError(true);
      setForecast(null);
    } finally {
      setForecastLoading(false);
    }
  }, [region]);

  useEffect(() => {
    void loadForecast();
  }, [loadForecast]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CloudSun className="h-5 w-5 text-sky" aria-hidden />
            <h3 className="font-display text-lg font-bold text-charcoal">Климат и прогноз</h3>
          </div>
          <p className="mt-1 text-sm text-slate">
            Средние нормы по месяцам и актуальный прогноз на три дня — данные Open-Meteo.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ARGENTINA_CLIMATE_REGIONS.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRegionId(r.id)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm",
                regionId === r.id
                  ? "border-sky/40 bg-sky/10 text-sky"
                  : "border-gray-200 bg-white text-foreground/80 hover:border-sky/30 hover:bg-sky/5"
              )}
            >
              {r.shortName}
            </button>
          ))}
        </div>
      </div>

      <ForecastCompactStrip
        regionShortName={region.shortName}
        forecast={forecast}
        loading={forecastLoading}
        error={forecastError}
        onRefresh={() => void loadForecast()}
      />

      <section
        aria-label="Средняя погода по месяцам"
        className="rounded-3xl border border-gray-100 bg-gradient-to-br from-white via-surface-muted/20 to-sky/5 p-4 shadow-card sm:p-6"
      >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="flex items-center gap-1.5 text-sm font-medium text-charcoal">
                <Thermometer className="h-4 w-4 text-sky" aria-hidden />
                {region.name}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate">{region.description}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div
                className="inline-flex rounded-full border border-gray-200 bg-white p-0.5"
                role="tablist"
                aria-label="Режим отображения климата"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={viewMode === "cards"}
                  onClick={() => setViewMode("cards")}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm",
                    viewMode === "cards"
                      ? "bg-sky/10 text-sky"
                      : "text-slate hover:text-charcoal"
                  )}
                >
                  <LayoutGrid className="h-3.5 w-3.5" aria-hidden />
                  Карточки
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={viewMode === "schedule"}
                  onClick={() => setViewMode("schedule")}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm",
                    viewMode === "schedule"
                      ? "bg-sky/10 text-sky"
                      : "text-slate hover:text-charcoal"
                  )}
                >
                  <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                  Расписание
                </button>
              </div>
              <span className="rounded-full bg-charcoal/5 px-2.5 py-1 text-[11px] font-medium text-slate">
                Средние нормы
              </span>
            </div>
          </div>

          <div className="mt-5">
            {viewMode === "cards" ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
                {months.map((month) => (
                  <MonthCard
                    key={month.month}
                    month={month}
                    isCurrent={month.month === currentMonth}
                    tempScale={tempScale}
                    imageSrc={getClimateMonthImage(regionId, month.month)}
                  />
                ))}
              </div>
            ) : (
              <ClimateScheduleView
                months={months}
                currentMonth={currentMonth}
                tempScale={tempScale}
              />
            )}
          </div>

          <p className="mt-4 text-[11px] leading-relaxed text-slate">
            Температуры — средние дневные максимумы и ночные минимумы по климатическим нормам. Южное
            полушарие: декабрь–февраль — лето, июнь–август — зима.
          </p>
      </section>
    </div>
  );
}

export function ArgentinaWeatherPanelSkeleton() {
  return (
    <div className="animate-pulse space-y-4 rounded-3xl border border-gray-100 bg-white p-6" aria-busy="true">
      <div className="h-6 w-48 rounded bg-gray-200" />
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="h-36 rounded-2xl bg-gray-100" />
        ))}
      </div>
    </div>
  );
}
