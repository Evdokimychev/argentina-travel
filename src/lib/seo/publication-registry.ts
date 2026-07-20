export type RuUrlDisposition = "index" | "noindex" | "redirect" | "withheld";

export interface RuUrlDecision {
  path: string;
  match: "exact" | "prefix";
  disposition: Exclude<RuUrlDisposition, "index">;
  canonicalPath?: string;
  reason:
    | "private_or_transactional"
    | "search_results"
    | "missing_self_canonical"
    | "unstable_partner_route"
    | "duplicate_content"
    | "editorial_quarantine";
}

export interface RuPublicationCandidate {
  path: string;
  published: boolean;
  indexable: boolean;
  canonicalPath: string;
}

export interface RuPublicationEvaluation {
  path: string | null;
  canonicalPath: string | null;
  disposition: RuUrlDisposition;
  eligibleForSitemap: boolean;
  reason:
    | "published_self_canonical"
    | "invalid_path"
    | "locale_not_published"
    | "not_published"
    | "not_indexable"
    | "not_self_canonical"
    | RuUrlDecision["reason"];
}

/**
 * Explicit exceptions to the default RU publication contract.
 *
 * A route is sitemap-eligible only when its owning source has marked it as
 * published and indexable, its canonical is self-referencing, and it is not
 * overridden here. Keep this list small: publication state for tours, CMS
 * documents and knowledge-base entries belongs to their source repositories.
 */
export const RU_URL_DECISIONS: readonly RuUrlDecision[] = [
  {
    path: "/immigration",
    match: "prefix",
    disposition: "noindex",
    reason: "editorial_quarantine",
  },
  {
    path: "/baza-znaniy/ciudad-de-salta",
    match: "exact",
    disposition: "redirect",
    canonicalPath: "/baza-znaniy/salta",
    reason: "duplicate_content",
  },
  {
    path: "/baza-znaniy/parque-nacional-los-cardones",
    match: "exact",
    disposition: "redirect",
    canonicalPath: "/baza-znaniy/los-cardones",
    reason: "duplicate_content",
  },
  {
    path: "/baza-znaniy/parque-nacional-tierra-del-fuego",
    match: "exact",
    disposition: "redirect",
    canonicalPath: "/baza-znaniy/ognennaya-zemlya",
    reason: "duplicate_content",
  },
  {
    path: "/excursions/city/city-151",
    match: "exact",
    disposition: "redirect",
    canonicalPath: "/excursions/city/Buenos_Aires",
    reason: "duplicate_content",
  },
  {
    path: "/excursions/city/Puerto_Iguasu",
    match: "exact",
    disposition: "redirect",
    canonicalPath: "/destinations/iguazu",
    reason: "unstable_partner_route",
  },
  {
    path: "/excursions/city/Puerto_Iguazu",
    match: "exact",
    disposition: "redirect",
    canonicalPath: "/destinations/iguazu",
    reason: "unstable_partner_route",
  },
  {
    path: "/baza-znaniy/poisk",
    match: "exact",
    disposition: "noindex",
    reason: "search_results",
  },
  {
    path: "/booking/find",
    match: "exact",
    disposition: "noindex",
    reason: "private_or_transactional",
  },
  {
    path: "/podbor",
    match: "exact",
    disposition: "withheld",
    reason: "missing_self_canonical",
  },
  {
    path: "/join",
    match: "exact",
    disposition: "withheld",
    reason: "missing_self_canonical",
  },
  {
    path: "/organizers",
    match: "prefix",
    disposition: "withheld",
    reason: "missing_self_canonical",
  },
  {
    path: "/excursions/guide",
    match: "prefix",
    disposition: "withheld",
    reason: "unstable_partner_route",
  },
  {
    path: "/organizer",
    match: "prefix",
    disposition: "noindex",
    reason: "private_or_transactional",
  },
  {
    path: "/profile",
    match: "prefix",
    disposition: "noindex",
    reason: "private_or_transactional",
  },
  {
    path: "/booking/pay",
    match: "prefix",
    disposition: "noindex",
    reason: "private_or_transactional",
  },
  {
    path: "/booking/travelers",
    match: "prefix",
    disposition: "noindex",
    reason: "private_or_transactional",
  },
  {
    path: "/trip",
    match: "prefix",
    disposition: "noindex",
    reason: "private_or_transactional",
  },
  {
    path: "/auth",
    match: "prefix",
    disposition: "noindex",
    reason: "private_or_transactional",
  },
  {
    path: "/embed",
    match: "prefix",
    disposition: "noindex",
    reason: "private_or_transactional",
  },
  {
    path: "/dev",
    match: "prefix",
    disposition: "noindex",
    reason: "private_or_transactional",
  },
] as const;

const UNPUBLISHED_EXCURSION_CITY_ALIASES = new Set([
  "/excursions/city/puerto_iguazu",
  "/excursions/city/puerto_iguasu",
]);

function normalizeInternalPath(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return null;
  if (trimmed.includes("?") || trimmed.includes("#") || trimmed.includes("\\")) return null;

  const path = trimmed.length > 1 ? trimmed.replace(/\/+$/, "") : trimmed;
  return path || "/";
}

function isRuleMatch(path: string, rule: RuUrlDecision): boolean {
  if (rule.match === "exact") return path === rule.path;
  return path === rule.path || path.startsWith(`${rule.path}/`);
}

export function findRuUrlDecision(path: string): RuUrlDecision | null {
  const normalized = normalizeInternalPath(path);
  if (!normalized) return null;

  const explicit = RU_URL_DECISIONS.find((rule) => isRuleMatch(normalized, rule));
  if (explicit) return explicit;

  const lowercasePath = normalized.toLowerCase();
  if (
    UNPUBLISHED_EXCURSION_CITY_ALIASES.has(lowercasePath) ||
    /^\/excursions\/city\/city-\d+$/i.test(normalized)
  ) {
    return {
      path: normalized,
      match: "exact",
      disposition: "withheld",
      reason: "unstable_partner_route",
    };
  }

  return null;
}

export function evaluateRuPublication(
  candidate: RuPublicationCandidate,
): RuPublicationEvaluation {
  const path = normalizeInternalPath(candidate.path);
  const canonicalPath = normalizeInternalPath(candidate.canonicalPath);
  if (!path || !canonicalPath) {
    return {
      path,
      canonicalPath,
      disposition: "withheld",
      eligibleForSitemap: false,
      reason: "invalid_path",
    };
  }

  if (/^\/(?:en|es)(?:\/|$)/.test(path)) {
    return {
      path,
      canonicalPath,
      disposition: "noindex",
      eligibleForSitemap: false,
      reason: "locale_not_published",
    };
  }

  const decision = findRuUrlDecision(path);
  if (decision) {
    return {
      path,
      canonicalPath: decision.canonicalPath ?? canonicalPath,
      disposition: decision.disposition,
      eligibleForSitemap: false,
      reason: decision.reason,
    };
  }

  if (!candidate.published) {
    return {
      path,
      canonicalPath,
      disposition: "withheld",
      eligibleForSitemap: false,
      reason: "not_published",
    };
  }

  if (!candidate.indexable) {
    return {
      path,
      canonicalPath,
      disposition: "noindex",
      eligibleForSitemap: false,
      reason: "not_indexable",
    };
  }

  if (path !== canonicalPath) {
    return {
      path,
      canonicalPath,
      disposition: "redirect",
      eligibleForSitemap: false,
      reason: "not_self_canonical",
    };
  }

  return {
    path,
    canonicalPath,
    disposition: "index",
    eligibleForSitemap: true,
    reason: "published_self_canonical",
  };
}

/**
 * Final gate for every URL emitted by sitemap.ts. Candidate collectors are
 * publication-aware; this function applies cross-source canonical/noindex rules.
 */
export function filterRuSitemapPaths(paths: readonly string[]): string[] {
  const result: string[] = [];
  const seen = new Set<string>();

  for (const candidatePath of paths) {
    const evaluation = evaluateRuPublication({
      path: candidatePath,
      canonicalPath: candidatePath,
      published: true,
      indexable: true,
    });
    if (!evaluation.eligibleForSitemap || !evaluation.path || seen.has(evaluation.path)) continue;
    seen.add(evaluation.path);
    result.push(evaluation.path);
  }

  return result;
}
