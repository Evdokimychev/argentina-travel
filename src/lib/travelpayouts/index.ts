export {
  createTravelpayoutsPartnerLink,
  createTravelpayoutsPartnerLinks,
  createTripsterAffiliateLink,
  TravelpayoutsError,
  isTravelpayoutsConfigured,
} from "@/lib/travelpayouts/client";

export { getTravelpayoutsConfig, isTravelpayoutsConfigured as isTravelpayoutsEnvConfigured } from "@/lib/travelpayouts/env";

export type {
  TravelpayoutsLinkInput,
  TravelpayoutsLinkResult,
} from "@/lib/travelpayouts/types";
