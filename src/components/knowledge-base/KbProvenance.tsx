import type {
  KbClaim,
  KbEntry,
  KbSource,
} from "@/lib/knowledge-base/types";
import {
  KbClaimSourceMarkers,
  type KbPublicClaim,
  type KbPublicSourceReference,
} from "./KbClaimSourceMarkers";

export interface KbPublicProvenance {
  claims: KbPublicClaim[];
  claimsByText: ReadonlyMap<string, KbPublicClaim>;
}

const REVIEWER_ROLE_LABELS: Record<string, string> = {
  editor: "Редактор",
  "fact-checker": "Фактчекер",
  fact_checker: "Фактчекер",
  legal_editor: "Редактор по правовым вопросам",
  "legal-reviewer": "Редактор по правовым вопросам",
  medical_editor: "Редактор по вопросам здоровья",
  travel_editor: "Редактор путеводителя",
  редактор: "Редактор",
  фактчекер: "Фактчекер",
  "редакционная проверка источников": "Редактор",
};

export function normalizeKbClaimText(value: string): string {
  return value
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_match, id, label) => label ?? id)
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("ru");
}

function externalSourceUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:"
      ? parsed.toString()
      : null;
  } catch {
    return null;
  }
}

function sourceIsPubliclyUsable(source: KbSource): source is KbSource & {
  id: string;
  url: string;
} {
  return Boolean(
    source.id?.trim() &&
      externalSourceUrl(source.url) &&
      (source.url_status === "verified" || source.url_status === "redirected"),
  );
}

function formatVerifiedDate(value: string | undefined): string | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== value) {
    return undefined;
  }
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function publicReviewerRole(claim: KbClaim): string | undefined {
  if (!claim.reviewer || typeof claim.reviewer === "string") return undefined;
  const role = claim.reviewer.role?.trim().toLocaleLowerCase("ru");
  return role ? REVIEWER_ROLE_LABELS[role] : undefined;
}

function hasStrictProvenance(entry: KbEntry): boolean {
  const provenance = entry.editorial?.provenance;
  return Boolean(
    provenance?.applicable &&
      provenance.declared &&
      provenance.mode === "strict" &&
      provenance.strict_ready &&
      provenance.issue_count === 0 &&
      Array.isArray(provenance.issue_codes) &&
      provenance.issue_codes.length === 0,
  );
}

/**
 * Builds the public view only from a complete strict provenance chain.
 * Diagnostic codes and internal identifiers never cross this boundary.
 */
export function buildKbPublicProvenance(entry: KbEntry): KbPublicProvenance | null {
  if (!hasStrictProvenance(entry) || !entry.claims?.length || !entry.sources?.length) {
    return null;
  }

  const sourceNumbers = new Map<string, KbPublicSourceReference>();
  const sourceAuthorities = new Map<string, KbSource["authority"]>();
  for (const [index, source] of entry.sources.entries()) {
    if (!sourceIsPubliclyUsable(source)) continue;
    const id = source.id.trim();
    if (sourceNumbers.has(id)) return null;
    sourceNumbers.set(id, {
      number: index + 1,
      title: source.title?.trim() || "Источник",
      url: externalSourceUrl(source.url)!,
    });
    sourceAuthorities.set(id, source.authority);
  }

  const claims: KbPublicClaim[] = [];
  const claimIds = new Set<string>();
  const claimTexts = new Set<string>();
  const normalizedBody = normalizeKbClaimText(entry.body);
  for (const claim of entry.claims) {
    const text = claim.text?.trim();
    const normalizedText = text ? normalizeKbClaimText(text) : "";
    const claimId = claim.id?.trim();
    if (
      !claimId ||
      !text ||
      !normalizedText ||
      !normalizedBody.includes(normalizedText) ||
      claimIds.has(claimId) ||
      claimTexts.has(normalizedText) ||
      !Array.isArray(claim.source_ids)
    ) {
      return null;
    }

    const uniqueSourceIds = [...new Set(claim.source_ids.map((id) => id.trim()))].filter(Boolean);
    const sources = uniqueSourceIds.map((id) => sourceNumbers.get(id));
    if (sources.length === 0 || sources.some((source) => !source)) return null;
    if (
      claim.sensitive &&
      !uniqueSourceIds.some((sourceId) => sourceAuthorities.get(sourceId) === "primary")
    ) {
      return null;
    }

    const verifiedAt = formatVerifiedDate(claim.verified_at);
    const reviewerRole = publicReviewerRole(claim);
    if (claim.sensitive && (!verifiedAt || !reviewerRole)) return null;

    claimIds.add(claimId);
    claimTexts.add(normalizedText);
    claims.push({
      text,
      normalizedText,
      sources: sources as KbPublicSourceReference[],
      ...(verifiedAt ? { verifiedAt } : {}),
      ...(reviewerRole ? { reviewerRole } : {}),
    });
  }

  if (claims.length === 0) return null;
  return {
    claims,
    claimsByText: new Map(claims.map((claim) => [claim.normalizedText, claim])),
  };
}

export function isKbSensitiveEntryStrictlyVerified(entry: KbEntry): boolean {
  const sensitive = Boolean(
    entry.editorial?.sensitive || entry.claims?.some((claim) => claim.sensitive),
  );
  return !sensitive || Boolean(buildKbPublicProvenance(entry));
}

/** Human-readable audit trail for facts that passed strict publication checks. */
export default function KbProvenance({ data }: { data: KbPublicProvenance | null }) {
  if (!data) return null;

  return (
    <section className="mt-7 rounded-panel border border-sky/25 bg-sky-pale/45 p-4 sm:p-5">
      <h2 className="text-base font-semibold text-foreground">Как проверены ключевые факты</h2>
      <p className="mt-1 text-sm leading-relaxed text-muted">
        Для каждого утверждения указаны источники и сведения о редакционной проверке.
      </p>
      <ul className="mt-4 space-y-4">
        {data.claims.map((claim) => (
          <li key={claim.normalizedText} className="text-sm leading-relaxed text-foreground">
            <p>
              {claim.text}
              <KbClaimSourceMarkers claim={claim} />
            </p>
            {(claim.verifiedAt || claim.reviewerRole) && (
              <p className="mt-1 text-xs text-slate">
                {claim.verifiedAt ? `Сверено ${claim.verifiedAt}` : null}
                {claim.verifiedAt && claim.reviewerRole ? " · " : null}
                {claim.reviewerRole ?? null}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
