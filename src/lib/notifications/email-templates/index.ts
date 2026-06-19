export type { EmailLayoutOptions, EmailTemplateResult, TransactionalEmailCategory } from "./types";

export {
  escapeHtml,
  formatRecipientName,
  formatRuDate,
  shortText,
  stripHtml,
} from "./utils";
export { renderEmailLayout, renderPlainEmail } from "./layout";

export {
  renderBookingConfirmedEmail,
  type BookingConfirmedTemplateInput,
} from "./booking-confirmed";
export {
  renderBookingStatusChangedEmail,
  type BookingStatusChangedTemplateInput,
} from "./booking-status-changed";
export {
  renderPaymentReceivedEmail,
  type PaymentReceivedTemplateInput,
} from "./payment-received";
export {
  renderReviewApprovedEmail,
  type ReviewApprovedTemplateInput,
} from "./review-approved";
export {
  renderDigestDailyEmail,
  type DigestDailyTemplateInput,
  type DigestEventItem,
} from "./digest-daily";
export {
  renderContentFreshnessReportEmail,
  type ContentFreshnessReportTemplateInput,
  type ContentFreshnessReportItem,
} from "./content-freshness-report";
