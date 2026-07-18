const MIXED_SCRIPT_WORD_RE =
  /(?=[\p{L}\p{M}-]*\p{Script=Latin})(?=[\p{L}\p{M}-]*\p{Script=Cyrillic})[\p{L}\p{M}-]+/u;

const ENGLISH_DRAFT_PHRASE_RE =
  /\b(?:walkways?|calving|seven lakes route|big ice|mini-?trekking|guesthouse|snatch theft|offline maps?|remote work|upload|forecast yesterday|booking|viewpoint|trailhead)\b/i;

const EDITORIAL_ARTIFACT_RE =
  /\b(?:placeholder|lorem ipsum|todo|tbd)\b|(?:в разработке|подключается|скоро появится)/i;

/** Консервативный фильтр импортных строк перед показом на публичных страницах. */
export function isEditoriallyCleanRussianText(value: string): boolean {
  const text = value.trim();
  if (!text) return false;
  return (
    !MIXED_SCRIPT_WORD_RE.test(text) &&
    !ENGLISH_DRAFT_PHRASE_RE.test(text) &&
    !EDITORIAL_ARTIFACT_RE.test(text)
  );
}
