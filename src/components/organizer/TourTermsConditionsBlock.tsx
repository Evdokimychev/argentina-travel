"use client";

import TourTermsListBlock from "@/components/organizer/TourTermsListBlock";
import { listItemsToText, textToListItems } from "@/data/tour-terms-defaults";

interface TourTermsConditionsBlockProps {
  includedText: string;
  excludedText: string;
  onIncludedChange: (text: string) => void;
  onExcludedChange: (text: string) => void;
}

export default function TourTermsConditionsBlock({
  includedText,
  excludedText,
  onIncludedChange,
  onExcludedChange,
}: TourTermsConditionsBlockProps) {
  return (
    <section className="space-y-5 rounded-2xl border border-gray-200/60 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="font-heading text-xl font-bold text-charcoal sm:text-2xl">Условия тура</h2>

      <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
        <div className="rounded-2xl border border-gray-200/80 bg-gray-50/50 p-4 sm:p-5">
          <TourTermsListBlock
            variant="embedded"
            title="Включено в стоимость"
            description="Перечислите услуги и расходы, которые уже входят в стоимость тура"
            items={textToListItems(includedText)}
            onChange={(items) => onIncludedChange(listItemsToText(items))}
            placeholder="Например: трансферы по программе"
          />
        </div>

        <div className="rounded-2xl border border-gray-200/80 bg-gray-50/50 p-4 sm:p-5">
          <TourTermsListBlock
            variant="embedded"
            title="Оплачивается отдельно"
            description="Укажите расходы, которые участник оплачивает отдельно"
            items={textToListItems(excludedText)}
            onChange={(items) => onExcludedChange(listItemsToText(items))}
            placeholder="Например: авиабилеты"
          />
        </div>
      </div>
    </section>
  );
}
