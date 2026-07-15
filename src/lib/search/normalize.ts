const COMBINING_MARKS_RE = /[\u0300-\u036f]/g;
const NON_WORD_RE = /[^a-zа-я0-9]+/gi;

export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(COMBINING_MARKS_RE, "")
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(NON_WORD_RE, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function tokenizeSearchText(value: string): string[] {
  return normalizeSearchText(value).split(" ").filter(Boolean);
}

export function levenshteinDistance(left: string, right: string): number {
  if (left === right) return 0;
  if (left.length === 0) return right.length;
  if (right.length === 0) return left.length;

  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex];
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const substitutionCost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + substitutionCost
      );
    }
    previous = current;
  }

  return previous[right.length];
}

export function fuzzyTokenMatches(queryToken: string, candidateToken: string): boolean {
  if (candidateToken.includes(queryToken) || queryToken.includes(candidateToken)) return true;
  if (queryToken.length < 4 || candidateToken.length < 4) return false;

  const allowedDistance = Math.max(queryToken.length, candidateToken.length) >= 8 ? 2 : 1;
  if (Math.abs(queryToken.length - candidateToken.length) > allowedDistance) return false;
  return levenshteinDistance(queryToken, candidateToken) <= allowedDistance;
}

export function searchTextMatches(value: string, query: string): boolean {
  const queryTokens = tokenizeSearchText(query);
  if (queryTokens.length === 0) return false;
  const candidateTokens = tokenizeSearchText(value);
  return queryTokens.every((queryToken) =>
    candidateTokens.some((candidateToken) => fuzzyTokenMatches(queryToken, candidateToken))
  );
}
