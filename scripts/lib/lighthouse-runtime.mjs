export function resolveLighthouseStartTimeout(value, fallback = 180_000) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed < 30_000 || parsed > 600_000) {
    return fallback;
  }
  return parsed;
}
