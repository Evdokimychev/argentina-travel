"use client";

import { Plus, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SwitchRow } from "@/components/ui/switch";
import {
  createEmptyGroupDiscountTier,
  formatGroupDiscountTierLabel,
  normalizeGroupDiscountSettings,
} from "@/lib/group-discount";
import type { GroupDiscountSettings, GroupDiscountTier } from "@/types/group-discount";

interface TourGroupDiscountBlockProps {
  settings: GroupDiscountSettings;
  basePriceUsd: number;
  onChange: (settings: GroupDiscountSettings) => void;
}

function updateTier(
  tiers: GroupDiscountTier[],
  id: string,
  patch: Partial<GroupDiscountTier>
): GroupDiscountTier[] {
  return tiers.map((tier) => (tier.id === id ? { ...tier, ...patch } : tier));
}

export default function TourGroupDiscountBlock({
  settings,
  basePriceUsd,
  onChange,
}: TourGroupDiscountBlockProps) {
  const normalized = normalizeGroupDiscountSettings(settings);

  function patchSettings(next: Partial<GroupDiscountSettings>) {
    onChange(normalizeGroupDiscountSettings({ ...settings, ...next }));
  }

  function addTier() {
    patchSettings({ tiers: [...settings.tiers, createEmptyGroupDiscountTier()] });
  }

  return (
    <section className="space-y-5 rounded-2xl border border-gray-200/60 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky/10 text-sky">
          <Users className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-xl font-bold text-charcoal sm:text-2xl">
            Групповая скидка
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-slate">
            Снижайте цену за человека, когда в брони два и больше туристов. Стоимость пересчитывается
            автоматически при выборе количества участников.
          </p>
        </div>
      </div>

      <SwitchRow
        label="Включить групповую скидку"
        checked={settings.enabled}
        onCheckedChange={(enabled) => patchSettings({ enabled })}
      />
      <p className="text-xs leading-relaxed text-slate">
        Не применяется к партнёрским экскурсиям Tripster и Sputnik8 — только к турам на платформе.
      </p>

      {settings.enabled ? (
        <>
          <div className="rounded-2xl border border-sky/20 bg-sky/[0.06] px-4 py-3 text-sm leading-relaxed text-charcoal">
            Задайте диапазоны туристов и размер скидки. Если подходят несколько диапазонов, гость
            получит <span className="font-semibold">наиболее выгодную</span> цену за человека.
          </div>

          <div className="space-y-4">
            {settings.tiers.length === 0 ? (
              <p className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-slate">
                Добавьте первый диапазон — например, от 2 человек со скидкой 5%.
              </p>
            ) : (
              settings.tiers.map((tier, index) => (
                <div
                  key={tier.id}
                  className="space-y-4 rounded-2xl border border-gray-200 bg-gray-50/60 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-charcoal">Диапазон {index + 1}</p>
                    <button
                      type="button"
                      onClick={() =>
                        patchSettings({ tiers: settings.tiers.filter((item) => item.id !== tier.id) })
                      }
                      className="inline-flex items-center gap-1 text-xs font-medium text-slate hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      Удалить
                    </button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-charcoal">
                        От, человек
                      </label>
                      <Input
                        type="number"
                        min={2}
                        value={tier.minGuests}
                        onChange={(event) =>
                          patchSettings({
                            tiers: updateTier(settings.tiers, tier.id, {
                              minGuests: Math.max(2, Number(event.target.value) || 2),
                            }),
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-charcoal">
                        До, человек
                      </label>
                      <Input
                        type="number"
                        min={tier.minGuests}
                        placeholder="Без ограничения"
                        value={tier.maxGuests ?? ""}
                        onChange={(event) => {
                          const raw = event.target.value.trim();
                          patchSettings({
                            tiers: updateTier(settings.tiers, tier.id, {
                              maxGuests: raw ? Math.max(tier.minGuests, Number(raw) || tier.minGuests) : null,
                            }),
                          });
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-charcoal">
                        Тип скидки
                      </label>
                      <select
                        value={tier.discountType}
                        onChange={(event) =>
                          patchSettings({
                            tiers: updateTier(settings.tiers, tier.id, {
                              discountType:
                                event.target.value === "fixed_per_person"
                                  ? "fixed_per_person"
                                  : "percent",
                            }),
                          })
                        }
                        className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-charcoal"
                      >
                        <option value="percent">Процент от базовой цены</option>
                        <option value="fixed_per_person">Фиксированная цена за человека ($)</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-charcoal">
                        {tier.discountType === "percent" ? "Скидка, %" : "Цена за человека, $"}
                      </label>
                      <Input
                        type="number"
                        min={0}
                        max={tier.discountType === "percent" ? 100 : undefined}
                        value={tier.value}
                        onChange={(event) =>
                          patchSettings({
                            tiers: updateTier(settings.tiers, tier.id, {
                              value: Math.max(0, Number(event.target.value) || 0),
                            }),
                          })
                        }
                      />
                    </div>
                  </div>

                  {tier.value > 0 ? (
                    <p className="text-xs text-slate">
                      Предпросмотр:{" "}
                      <span className="font-medium text-charcoal">
                        {formatGroupDiscountTierLabel(tier, basePriceUsd)}
                      </span>
                    </p>
                  ) : null}
                </div>
              ))
            )}
          </div>

          <Button type="button" variant="outline" onClick={addTier} className="w-full sm:w-auto">
            <Plus className="h-4 w-4" aria-hidden />
            Добавить диапазон
          </Button>

          {normalized.enabled && normalized.tiers.length > 0 ? (
            <ul className="space-y-1 rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-sm text-charcoal">
              {normalized.tiers.map((tier) => (
                <li key={tier.id}>{formatGroupDiscountTierLabel(tier, basePriceUsd)}</li>
              ))}
            </ul>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
