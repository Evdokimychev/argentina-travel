export { IntuiError, postIntuiMethod } from "@/lib/intui/client";
export { buildIntuiTransferBookUrl, buildIntuiTransferSearchUrl } from "@/lib/intui/deep-link";
export { getIntuiConfig, isIntuiConfigured } from "@/lib/intui/env";
export { searchIntuiLocations, searchTransfers } from "@/lib/intui/search";
export {
  createTransferAffiliateRedirectUrl,
  createTransferBookAffiliateUrl,
  createTransferSearchAffiliateUrl,
  logTransferAffiliateClick,
} from "@/lib/intui/transfers-affiliate";

export type {
  IntuiApiStatus,
  TransferLocation,
  TransferLocationType,
  TransferOffer,
  TransferSearchParams,
  TransferSearchResult,
} from "@/lib/intui/types";
