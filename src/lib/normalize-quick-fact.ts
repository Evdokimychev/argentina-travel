export type QuickFactInput = {
  label: string;
  headline?: string;
  detail?: string;
  /** Legacy single-line value; split on « — » when headline is omitted */
  value?: string;
};

export type NormalizedQuickFact = {
  headline: string;
  detail?: string;
};

/** Resolves headline + detail from new or legacy quick-fact fields. */
export function normalizeQuickFact(fact: QuickFactInput): NormalizedQuickFact {
  if (fact.headline) {
    return { headline: fact.headline, detail: fact.detail };
  }

  const raw = fact.value?.trim();
  if (!raw) {
    return { headline: fact.label, detail: fact.detail };
  }

  const dashSplit = raw.split(/\s+[—–-]\s+/);
  if (dashSplit.length >= 2) {
    return {
      headline: dashSplit[0]!.trim(),
      detail: dashSplit.slice(1).join(" — ").trim() || fact.detail,
    };
  }

  return { headline: raw, detail: fact.detail };
}
