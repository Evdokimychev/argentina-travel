import type { Tour } from "@/types/tour";
import {
  hasTourPolicies,
  resolveCancellationText,
  resolveInsuranceLabel,
} from "@/lib/tour-public-display";
import { SectionHeading } from "./InfoModal";

interface TourPoliciesSectionProps {
  tour: Tour;
}

export default function TourPoliciesSection({ tour }: TourPoliciesSectionProps) {
  if (!hasTourPolicies(tour)) return null;

  const insurance = tour.terms.insurance;
  const insuranceLabel = resolveInsuranceLabel(tour);
  const cancellationText = resolveCancellationText(tour);
  const showInsurance =
    insurance &&
    insurance.type !== "not_required" &&
    (insuranceLabel || insurance.description.trim());

  return (
    <section id="policies" className="tour-section-target space-y-8">
      {showInsurance ? (
        <div>
          <SectionHeading title="Страхование" />
          <div className="rounded-2xl border border-sky-200 bg-sky-50/50 p-6 shadow-sm">
            {insuranceLabel ? (
              <p className="text-sm font-semibold text-charcoal">{insuranceLabel}</p>
            ) : null}
            {insurance.description.trim() ? (
              <p className="mt-2 text-sm leading-relaxed text-slate">{insurance.description}</p>
            ) : null}
          </div>
        </div>
      ) : null}

      {cancellationText ? (
        <div>
          <SectionHeading title="Условия отмены" />
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="whitespace-pre-line text-sm leading-relaxed text-slate">
              {cancellationText}
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
