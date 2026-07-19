/**
 * The current public site is an Argentina storefront, while inventory remains
 * multi-market. Keeping this choice explicit prevents repositories from
 * silently turning every future vertical into an Argentina-only data model.
 */
export const PRIMARY_PUBLIC_MARKET = {
  id: "ar",
  countryCode: "AR",
  label: "Аргентина",
  timezone: "America/Argentina/Buenos_Aires",
} as const;
