"use client";

import { useEffect, useState } from "react";
import { Database, Info, Plus, RefreshCw } from "lucide-react";
import { useHtml5ListReorder } from "@/hooks/useHtml5ListReorder";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { SwitchRow } from "@/components/ui/switch";
import TourGroupDatesAddModal from "@/components/organizer/TourGroupDatesAddModal";
import GroupDateEditor from "@/components/organizer/GroupDateEditor";
import { type OrganizerGroupTourDate } from "@/data/tour-booking-defaults";
import type { CurrencyCode } from "@/types/locale";

interface TourGroupDatesBlockProps {
  dates: OrganizerGroupTourDate[];
  autoRollToNextYear: boolean;
  durationDays: number;
  durationNights: number;
  priceCurrency: CurrencyCode;
  defaultPriceUsd: number;
  tourId?: string;
  onDatesChange: (dates: OrganizerGroupTourDate[]) => void;
  onAutoRollChange: (enabled: boolean) => void;
}

export default function TourGroupDatesBlock({
  dates,
  autoRollToNextYear,
  durationDays,
  durationNights,
  priceCurrency,
  defaultPriceUsd,
  tourId,
  onDatesChange,
  onAutoRollChange,
}: TourGroupDatesBlockProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncRefreshing, setSyncRefreshing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [dbSlotsCount, setDbSlotsCount] = useState<number | null>(null);
  const currencySuffix = priceCurrency === "USD" ? "US$" : priceCurrency;

  function removeAt(index: number) {
    onDatesChange(dates.filter((_, itemIndex) => itemIndex !== index));
  }

  function updateAt(index: number, date: OrganizerGroupTourDate) {
    onDatesChange(dates.map((item, itemIndex) => (itemIndex === index ? date : item)));
  }

  function handleAddDates(nextDates: OrganizerGroupTourDate[]) {
    onDatesChange([...dates, ...nextDates]);
  }

  const hasVariedPrices =
    dates.length > 1 && new Set(dates.map((date) => date.priceUsd)).size > 1;

  const reorder = useHtml5ListReorder(dates, onDatesChange);
  const canSyncInventory = Boolean(tourId);

  async function refreshInventory() {
    if (!tourId) return;
    setSyncRefreshing(true);
    setSyncError(null);

    try {
      const response = await fetch(`/api/organizer/tours/${encodeURIComponent(tourId)}/availability`, {
        method: "GET",
        credentials: "same-origin",
      });
      const body = (await response.json()) as { slots?: unknown[]; error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Не удалось загрузить слоты из базы");
      }
      setDbSlotsCount(Array.isArray(body.slots) ? body.slots.length : 0);
      setSyncMessage(
        Array.isArray(body.slots) && body.slots.length > 0
          ? `В базе сохранено ${body.slots.length} слотов.`
          : "В базе пока нет слотов — используются даты из черновика."
      );
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : "Не удалось загрузить слоты");
    } finally {
      setSyncRefreshing(false);
    }
  }

  async function syncInventoryToDb() {
    if (!tourId) return;
    setSyncLoading(true);
    setSyncError(null);

    try {
      const slots = dates
        .filter((date) => Boolean(date.startDate))
        .map((date) => {
          const normalizedCapacity = Math.max(0, date.totalSeats || date.spotsLeft || 0);
          const normalizedLeft = Math.max(0, date.spotsLeft || 0);
          const bookedCount =
            normalizedCapacity > 0 ? Math.max(normalizedCapacity - normalizedLeft, 0) : 0;
          return {
            date: date.startDate,
            capacity: normalizedCapacity,
            bookedCount,
            status: normalizedLeft <= 0 ? "sold_out" : "open",
          };
        });

      const response = await fetch(`/api/organizer/tours/${encodeURIComponent(tourId)}/availability`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ slots }),
      });
      const body = (await response.json()) as { slots?: unknown[]; error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Не удалось сохранить слоты в базе");
      }

      const total = Array.isArray(body.slots) ? body.slots.length : slots.length;
      setDbSlotsCount(total);
      setSyncMessage(`Слоты сохранены в базе: ${total}.`);
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : "Ошибка сохранения слотов");
    } finally {
      setSyncLoading(false);
    }
  }

  useEffect(() => {
    if (!tourId) return;
    void refreshInventory();
  }, [tourId]);

  return (
    <>
      <section className="space-y-5 rounded-2xl border border-gray-200/60 bg-white p-4 shadow-sm sm:p-5">
        <div>
          <h2 className="font-heading text-xl font-bold text-charcoal sm:text-2xl">
            Даты группового тура
          </h2>
          <p className="mt-1 text-sm text-slate">
            Укажите даты заезда и стоимость для каждой — турист увидит цены в календаре на странице
            тура.
            {reorder.canReorder
              ? " Перетащите карточку за ручку слева, чтобы изменить порядок в календаре."
              : null}
          </p>
        </div>

        <p className="flex items-start gap-2 rounded-xl border border-sky/15 bg-sky/[0.06] px-3.5 py-2.5 text-sm leading-relaxed text-charcoal">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky" aria-hidden />
          Разная стоимость на разные даты: задайте цену при добавлении заезда или измените её в
          карточке даты. В календаре бронирования доступны только указанные здесь даты.
        </p>

        <SwitchRow
          checked={autoRollToNextYear}
          onCheckedChange={onAutoRollChange}
          label="Автоматически переносить групповые даты на следующий год"
          labelAddon={<Info className="h-4 w-4 shrink-0 text-sky" aria-hidden />}
        />

        {hasVariedPrices ? (
          <p className="rounded-xl border border-violet-100 bg-violet-50/80 px-3.5 py-2 text-sm text-violet-950">
            На странице тура отображается диапазон цен и календарь с суммой на каждую дату заезда.
          </p>
        ) : null}

        {dates.length ? (
          <div className="space-y-3">
            {dates.map((date, index) => (
              <div
                key={date.id}
                onDragOver={(event) => reorder.onDragOver(index, event)}
                onDrop={(event) => reorder.onDrop(index, event)}
                className={cn(reorder.rowClassName(index))}
              >
                <GroupDateEditor
                  date={date}
                  index={index}
                  currencySuffix={currencySuffix}
                  onChange={(next) => updateAt(index, next)}
                  onRemove={() => removeAt(index)}
                  canReorder={reorder.canReorder}
                  isDragging={reorder.dragIndex === index}
                  onDragStart={(event) => reorder.onDragStart(index, event)}
                  onDragEnd={reorder.onDragEnd}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-rose-100 bg-rose-50/80 px-4 py-3 text-sm text-charcoal">
            Групповые даты не заполнены
          </div>
        )}

        {canSyncInventory ? (
          <div className="rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-charcoal">Инвентарь в базе</p>
                <p className="mt-1 text-xs text-slate">
                  Слоты для checkout и листа ожидания.
                  {dbSlotsCount != null ? ` Сейчас в базе: ${dbSlotsCount}.` : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 gap-1.5 text-xs"
                  onClick={() => void refreshInventory()}
                  disabled={syncRefreshing}
                >
                  <RefreshCw className={cn("h-3.5 w-3.5", syncRefreshing && "animate-spin")} />
                  Обновить
                </Button>
                <Button
                  type="button"
                  className="h-9 gap-1.5 text-xs"
                  onClick={() => void syncInventoryToDb()}
                  disabled={syncLoading}
                >
                  <Database className="h-3.5 w-3.5" />
                  {syncLoading ? "Сохраняем…" : "Сохранить слоты"}
                </Button>
              </div>
            </div>
            {syncError ? <p className="mt-2 text-xs text-red-600">{syncError}</p> : null}
            {!syncError && syncMessage ? <p className="mt-2 text-xs text-slate">{syncMessage}</p> : null}
          </div>
        ) : null}

        <div className="flex justify-end">
          <Button type="button" onClick={() => setModalOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Добавить групповые даты
          </Button>
        </div>
      </section>

      <TourGroupDatesAddModal
        open={modalOpen}
        durationDays={durationDays}
        durationNights={durationNights}
        currency={priceCurrency}
        defaultPriceUsd={defaultPriceUsd}
        onClose={() => setModalOpen(false)}
        onAdd={handleAddDates}
      />
    </>
  );
}
