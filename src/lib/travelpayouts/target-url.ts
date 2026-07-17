const ALLOWED_TRAVELPAYOUTS_TARGET_HOSTS = new Set([
  "experience.tripster.ru",
  "youtravel.me",
  "www.youtravel.me",
  "sputnik8.com",
  "www.sputnik8.com",
]);

export function isAllowedTravelpayoutsTargetUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !url.port &&
      ALLOWED_TRAVELPAYOUTS_TARGET_HOSTS.has(url.hostname.toLowerCase())
    );
  } catch {
    return false;
  }
}
