"use client";

import {
  ORGANIZER_TOUR_INSURANCE_DESCRIPTION_MAX,
  ORGANIZER_TOUR_INSURANCE_OPTIONS,
  type OrganizerTourInsuranceType,
} from "@/data/tour-terms-defaults";

interface TourInsuranceBlockProps {
  insuranceType: OrganizerTourInsuranceType;
  insuranceDescription: string;
  onInsuranceTypeChange: (type: OrganizerTourInsuranceType) => void;
  onInsuranceDescriptionChange: (description: string) => void;
}

export default function TourInsuranceBlock({
  insuranceType,
  insuranceDescription,
  onInsuranceTypeChange,
  onInsuranceDescriptionChange,
}: TourInsuranceBlockProps) {
  const showDescription =
    insuranceType === "required_not_included" || insuranceType === "recommended";

  return (
    <section className="space-y-4 rounded-2xl border border-gray-200/60 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="font-heading text-xl font-bold text-charcoal sm:text-2xl">Условия страхования</h2>

      <div className="relative">
        <label
          htmlFor="tour-insurance-type"
          className="pointer-events-none absolute left-3 top-0 z-10 -translate-y-1/2 bg-white px-1 text-xs font-medium text-slate"
        >
          Тип страховки
        </label>
        <select
          id="tour-insurance-type"
          value={insuranceType}
          onChange={(event) =>
            onInsuranceTypeChange(event.target.value as OrganizerTourInsuranceType)
          }
          className="flex h-14 w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 pt-1 text-sm text-charcoal focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        >
          {ORGANIZER_TOUR_INSURANCE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate"
          aria-hidden
        >
          ▾
        </span>
      </div>

      {showDescription ? (
        <div className="space-y-1.5">
          <label htmlFor="tour-insurance-description" className="text-xs font-medium text-charcoal">
            Описание дополнительной страховки
          </label>
          <textarea
            id="tour-insurance-description"
            value={insuranceDescription}
            maxLength={ORGANIZER_TOUR_INSURANCE_DESCRIPTION_MAX}
            rows={4}
            onChange={(event) => onInsuranceDescriptionChange(event.target.value)}
            placeholder="Описание дополнительной страховки, которую необходимо докупить"
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm leading-relaxed text-charcoal outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>
      ) : null}
    </section>
  );
}
