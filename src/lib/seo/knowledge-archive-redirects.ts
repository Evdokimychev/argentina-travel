import fs from "node:fs";
import path from "node:path";

type ArchivedKnowledgeEntry = {
  id?: unknown;
  status?: unknown;
  redirect_to?: unknown;
};

/**
 * These four historical URLs are also listed in the SEO registry as old
 * external canonicals. Remaining archive URLs are generated from the KB index.
 */
export const EXPLICITLY_REGISTERED_KNOWLEDGE_REDIRECT_IDS = new Set([
  "ciudad-de-salta",
  "parque-nacional-los-cardones",
  "parque-nacional-tierra-del-fuego",
  "aep-eze-stykovka",
]);

export type KnowledgeArchiveRedirect = {
  source: string;
  destination: string;
  permanent: true;
};

export function loadKnowledgeArchiveRedirects(
  indexPath = path.join(process.cwd(), "content", "knowledge-base", "_index", "content.json"),
): KnowledgeArchiveRedirect[] {
  const parsed = JSON.parse(fs.readFileSync(indexPath, "utf8")) as {
    entities?: ArchivedKnowledgeEntry[];
  };

  if (!Array.isArray(parsed.entities)) {
    throw new Error(`Knowledge-base index has no entities array: ${indexPath}`);
  }

  return parsed.entities.flatMap((entry) => {
    if (
      entry.status !== "archived" ||
      typeof entry.id !== "string" ||
      typeof entry.redirect_to !== "string" ||
      !entry.id.trim() ||
      !entry.redirect_to.trim() ||
      entry.id === entry.redirect_to ||
      EXPLICITLY_REGISTERED_KNOWLEDGE_REDIRECT_IDS.has(entry.id)
    ) {
      return [];
    }

    return [
      {
        source: `/baza-znaniy/${entry.id}`,
        destination: `/baza-znaniy/${entry.redirect_to}`,
        permanent: true as const,
      },
    ];
  });
}
