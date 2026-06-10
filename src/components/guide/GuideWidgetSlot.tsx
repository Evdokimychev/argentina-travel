import { Suspense } from "react";
import { Calculator, MapPin, Megaphone, Sparkles } from "lucide-react";
import ArgentinaExchangeRates from "@/components/guide/ArgentinaExchangeRates";
import ArgentinaWeatherPanel, {
  ArgentinaWeatherPanelSkeleton,
} from "@/components/guide/weather/ArgentinaWeatherPanel";
import type { GuidePillarWidgetSlot } from "@/types/guide-pillar";

type GuideWidgetSlotProps = {
  slot: GuidePillarWidgetSlot;
};

const PLACEHOLDER_MESSAGES: Record<string, string> = {
  calculator: "Калькулятор обмена — скоро. Сравните официальный, синий и MEP-курс для вашей суммы.",
  map: "Карта проверенных точек — скоро. Пока используйте рекомендации менеджера или отельный консьерж.",
  promo: "Партнёрские предложения — скоро. Скидки на трансферы, страховку и консультации.",
};

export default function GuideWidgetSlot({ slot }: GuideWidgetSlotProps) {
  if (slot.type === "exchange-rates") {
    return (
      <div id={slot.id} className="scroll-mt-24">
        <ArgentinaExchangeRates />
      </div>
    );
  }

  if (slot.type === "weather-panel") {
    return (
      <div id={slot.id} className="scroll-mt-24">
        <Suspense fallback={<ArgentinaWeatherPanelSkeleton />}>
          <ArgentinaWeatherPanel />
        </Suspense>
      </div>
    );
  }

  const icons = {
    calculator: Calculator,
    map: MapPin,
    promo: Megaphone,
  };
  const Icon = icons[slot.type] ?? Sparkles;

  return (
    <div
      id={slot.id}
      className="scroll-mt-24 rounded-2xl border border-dashed border-gray-200 bg-white p-6 shadow-card sm:p-8"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100">
          <Icon className="h-5 w-5 text-slate" aria-hidden />
        </div>
        <div>
          <h3 className="font-display text-base font-bold text-charcoal">{slot.label}</h3>
          <p className="mt-1 text-sm text-slate">
            {PLACEHOLDER_MESSAGES[slot.type] ?? "Интерактивный блок — в разработке."}
          </p>
          <span className="mt-2 inline-block rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-medium text-slate">
            Скоро
          </span>
        </div>
      </div>
    </div>
  );
}
