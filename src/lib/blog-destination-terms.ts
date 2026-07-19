type DestinationTermsSource = {
  name: string;
  keywords: readonly string[];
};

/** Слишком общие слова не должны самостоятельно назначать статье направление. */
export const AMBIGUOUS_BLOG_DESTINATION_TERMS = new Set([
  "ba",
  "буэнос",
  "catedral",
  "перито",
  "ледник",
  "огненная",
  "антарктида",
  "водопад",
  "вино",
  "каньон",
]);

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function getSafeBlogDestinationTerms(dest: DestinationTermsSource): string[] {
  return [
    dest.name,
    ...dest.keywords.filter(
      (term) => !AMBIGUOUS_BLOG_DESTINATION_TERMS.has(term.toLocaleLowerCase("ru")),
    ),
  ];
}

export function blogDestinationTermMatches(text: string, term: string): boolean {
  if (term.trim().length < 4) return false;
  const pattern = new RegExp(
    `(?<![\\p{L}\\p{N}])${escapeRegExp(term)}(?![\\p{L}\\p{N}])`,
    "iu",
  );
  return pattern.test(text);
}
