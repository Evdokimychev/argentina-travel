import type { SiteFormsGlobal } from "@/types/site-globals";

export type CaptchaFormId =
  | "contact"
  | "newsletter"
  | "native_booking"
  | "waitlist"
  | "shop_order"
  | "partner_booking";

const SELECTED_FIELD: Record<CaptchaFormId, keyof SiteFormsGlobal> = {
  contact: "captchaContact",
  newsletter: "captchaNewsletter",
  native_booking: "captchaNativeBooking",
  waitlist: "captchaWaitlist",
  shop_order: "captchaShopOrder",
  partner_booking: "captchaPartnerBooking",
};

export function isCaptchaRequired(
  settings: SiteFormsGlobal,
  formId: CaptchaFormId,
): boolean {
  if (settings.captchaMode === "off") return false;
  if (settings.captchaMode === "all_guest_writes") return true;
  return settings[SELECTED_FIELD[formId]] === true;
}
