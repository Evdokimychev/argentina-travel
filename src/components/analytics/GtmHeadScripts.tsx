import { buildGtmConsentDefaultScript } from "@/lib/analytics/gtm-consent";
import { isGtmEnabled } from "@/lib/analytics/gtm-config";

/** Consent Mode defaults — must be the first script touching dataLayer. */
export default function GtmHeadScripts() {
  if (!isGtmEnabled()) return null;

  return (
    <script
      id="gtm-consent-default"
      dangerouslySetInnerHTML={{ __html: buildGtmConsentDefaultScript() }}
    />
  );
}
