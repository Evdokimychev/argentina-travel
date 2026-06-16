export function buildInsuranceHref(options?: { travelers?: number }): string {
  const params = new URLSearchParams();
  const travelers = options?.travelers;
  if (travelers != null && travelers > 0) {
    params.set("travelers", String(travelers));
  }
  const query = params.toString();
  return query ? `/insurance?${query}` : "/insurance";
}
