import Link from "next/link";
import type { Tour } from "@/types/tour";
import {
  hasTourPolicies,
  resolveCancellationText,
  resolveInsuranceLabel,
} from "@/lib/tour-public-display";
import TourSection from "./TourSection";

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
    <TourSection id="policies" title="Условия и страхование">
      {showInsurance ? (
        <div>
          <h3 className="font-heading text-lg font-bold text-charcoal">Страхование</h3>
          <div className="mt-4 rounded-2xl border border-sky/20 bg-sky/5 p-6">
            {insuranceLabel ? (
              <p className="text-sm font-semibold text-charcoal">{insuranceLabel}</p>
            ) : null}
            {insurance.description.trim() ? (
              <p className="mt-2 text-sm leading-relaxed text-slate">{insurance.description}</p>
            ) : null}
            {insurance.type === "recommended" || insurance.type === "required_not_included" ? (
              <Link
                href="/insurance"
                className="mt-4 inline-flex text-sm font-semibold text-sky hover:underline"
              >
                Подобрать туристическую страховку →
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}

      {cancellationText ? (
        <div className={showInsurance ? "mt-8" : undefined}>
          <h3 className="font-heading text-lg font-bold text-charcoal">Условия отмены</h3>
          <div className="mt-4 rounded-2xl border border-gray-100 bg-surface-muted/40 p-6">
            <p className="whitespace-pre-line text-sm leading-relaxed text-slate">
              {cancellationText}
            </p>
          </div>
        </div>
      ) : null}
    </TourSection>
  );
}
