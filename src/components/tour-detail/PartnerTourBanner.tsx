import { ExternalLink } from "lucide-react";
import {
  PARTNER_TRIPSTER_BADGE_LABEL,
  PARTNER_TRIPSTER_BADGE_HINT,
} from "@/lib/tripster/partner-tour-utils";
import {
  PARTNER_YOUTRAVEL_BADGE_LABEL,
  PARTNER_YOUTRAVEL_BADGE_HINT,
} from "@/lib/youtravel/partner-tour-utils";

type PartnerTourBannerProps = {
  partnerSource?: "tripster" | "youtravel" | null;
};

function resolveBannerCopy(partnerSource?: "tripster" | "youtravel" | null) {
  if (partnerSource === "youtravel") {
    return {
      label: PARTNER_YOUTRAVEL_BADGE_LABEL,
      hint: PARTNER_YOUTRAVEL_BADGE_HINT,
    };
  }

  return {
    label: PARTNER_TRIPSTER_BADGE_LABEL,
    hint: PARTNER_TRIPSTER_BADGE_HINT,
  };
}

export default function PartnerTourBanner({ partnerSource = "tripster" }: PartnerTourBannerProps) {
  const { label, hint } = resolveBannerCopy(partnerSource);

  return (
    <div className="rounded-2xl border border-sky/20 bg-sky/5 px-4 py-3 sm:px-5 sm:py-4">
      <p className="flex items-start gap-2 text-sm leading-relaxed text-charcoal">
        <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-sky-dark" aria-hidden />
        <span>
          <span className="font-semibold">{label}.</span> {hint}
        </span>
      </p>
    </div>
  );
}
