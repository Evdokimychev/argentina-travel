const ALLOWED_PARTNER_HOSTS = [
  "tripster.ru",
  "youtravel.me",
  "sputnik8.com",
  "airalo.com",
  "intui.travel",
  "aviasales.ru",
  "aviasales.com",
  "aviasales.es",
  "aviasales.com.br",
] as const;

function isAllowedHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/\.$/, "");
  return ALLOWED_PARTNER_HOSTS.some(
    (allowed) => normalized === allowed || normalized.endsWith(`.${allowed}`),
  );
}

export function isAllowedPartnerLinkDestination(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && isAllowedHost(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
}
