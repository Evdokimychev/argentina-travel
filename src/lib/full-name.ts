export function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

export function joinFullName(firstName: string, lastName: string): string {
  return [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
}

const SHORT_DISPLAY_NAME_PATTERN = /^.+\s[\p{L}]\.$/u;

/** Public card label: «Иван Евдокимычев» → «Иван Е.» */
export function formatShortDisplayName(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return "";
  if (SHORT_DISPLAY_NAME_PATTERN.test(trimmed)) return trimmed;

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0];

  const firstName = parts[0];
  const surname = parts[parts.length - 1];
  const initial = [...surname][0]?.toUpperCase() ?? "";
  return initial ? `${firstName} ${initial}.` : firstName;
}
