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
  renderNewMessageEmail,
  type NewMessageTemplateInput,
} from "./new-message";
export {
  renderBookingReminder24hEmail,
  type BookingReminder24hTemplateInput,
} from "./booking-reminder-24h";
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
export {
  renderPrivacyDeleteCompletedEmail,
  type PrivacyDeleteCompletedTemplateInput,
} from "./privacy-delete-completed";
