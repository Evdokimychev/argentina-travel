"use client";

import { ListOrdered } from "lucide-react";
import { SwitchField } from "@/components/ui/switch";

interface TourWaitlistBlockProps {
  waitlistEnabled: boolean;
  onChange: (waitlistEnabled: boolean) => void;
}

export default function TourWaitlistBlock({
  waitlistEnabled,
  onChange,
}: TourWaitlistBlockProps) {
  return (
    <section className="space-y-4 rounded-2xl border border-gray-200/60 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
          <ListOrdered className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <h2 className="font-heading text-xl font-bold text-charcoal sm:text-2xl">
            Лист ожидания
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-slate">
            Если на выбранную дату не хватает мест или группа не набирается, турист может
            оставить заявку. Вы увидите её в разделе «Заявки» и сможете предложить место, когда
            ситуация изменится.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-violet-100 bg-violet-50/40 p-4">
        <SwitchField
          checked={waitlistEnabled}
          onCheckedChange={onChange}
          label="Принимать заявки в лист ожидания"
          description="Работает для групповых дат. Не заменяет бронирование — вы сами решаете, когда перевести заявку в бронирование."
        />
      </div>
    </section>
  );
}
