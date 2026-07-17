export const FORBIDDEN_PRODUCTION_ARTIFACT_MARKERS = [
  {
    label: "local development URL",
    pattern: /https?:\/\/(?:localhost|127\.0\.0\.1):300[0-3](?:\/|["'`])/i,
  },
  { label: "legacy local auth storage", pattern: /argentina-travel-auth-users/i },
  { label: "demo password", pattern: /\bdemo123\b/i },
  { label: "known booking demo id", pattern: /\bbooking-demo-new\b/i },
  { label: "known trip demo token", pattern: /\btrip-demo-iguazu\b/i },
  { label: "known demo email", pattern: /\banna\.k\.demo@example\.com\b/i },
  { label: "known private tour demo token", pattern: /\bdemo-fitz-roy-vip\b/i },
  { label: "known review demo id", pattern: /\breview-demo-published\b/i },
  {
    label: "structured demo record id",
    pattern:
      /\b(?:booking|review|trip|status|comment|task|update|trv)-demo(?:-[a-z0-9][a-z0-9-]*)?\b/i,
  },
  {
    label: "demo example email",
    pattern: /\b[a-z0-9._%+-]*demo[a-z0-9._%+-]*@(?:example\.(?:com|org|net)|test)\b/i,
  },
  {
    label: "demo credential or seed marker",
    pattern:
      /\b(?:demo|test)[_-](?:seed|token|secret|password|api[_-]?key)(?:[_-][a-z0-9]+)*\b/i,
  },
  {
    label: "demo value in token or id field",
    pattern:
      /(?:privateAccessToken|clientPortalToken|travelersFormToken|bookingId|reviewId|userId|["']id["'])\s*[:=]\s*["'][^"'\r\n]{0,80}(?:demo|seed)[^"'\r\n]*["']/i,
  },
];

export function findForbiddenProductionArtifactMarkers(source) {
  return FORBIDDEN_PRODUCTION_ARTIFACT_MARKERS.filter(({ pattern }) => pattern.test(source)).map(
    ({ label }) => label,
  );
}
