import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { GUIDE_PILLARS } from "@/data/guide-pillars";
import { IMMIGRATION_PILLARS } from "@/data/immigration-pillars";
import { EKONOMIKA_PILLAR } from "@/data/guide-pillar-ekonomika";
import { buildPublicPageMetadata } from "@/lib/page-metadata";

const root = join(process.cwd(), "src");

describe("Sprint 9 — editorial content hubs", () => {
  it("guide hub has hero, Lucide topic grid and quick-30 block", () => {
    const hub = readFileSync(join(root, "components/guide/GuideHubView.tsx"), "utf8");
    expect(hub).toContain("HubHero");
    expect(hub).toContain("getGuideTopicIcon");
    expect(hub).toContain('id="quick-30"');
    expect(hub).toContain("HubQuickFactsGrid");
    expect(hub).toContain("HubToc");
    expect(hub).toContain('variant="sidebar"');
  });

  it("pillar pages use sticky sidebar TOC and quick facts", () => {
    const pillar = readFileSync(join(root, "components/guide/GuidePillarView.tsx"), "utf8");
    expect(pillar).toContain("HubToc");
    expect(pillar).toContain('title="Кратко за 30 секунд"');
    expect(pillar).toContain('variant="sidebar"');
    const toc = readFileSync(join(root, "components/guide/hub/HubToc.tsx"), "utf8");
    expect(toc).toContain("sticky");
    expect(toc).toContain("hubTocStickyTopClass");
  });

  it("all guide and immigration pillars have quickFacts including ekonomika-i-dengi", () => {
    for (const pillar of Object.values(GUIDE_PILLARS)) {
      expect(pillar.quickFacts.length).toBeGreaterThan(0);
    }
    for (const pillar of Object.values(IMMIGRATION_PILLARS)) {
      expect(pillar.quickFacts.length).toBeGreaterThan(0);
    }
    expect(EKONOMIKA_PILLAR.quickFacts.length).toBeGreaterThanOrEqual(4);
  });

  it("immigration hub matches guide editorial pattern with legal warnings", () => {
    const hub = readFileSync(join(root, "components/immigration/ImmigrationHubView.tsx"), "utf8");
    expect(hub).toContain("HubHero");
    expect(hub).toContain("getImmigrationHubTopicIcon");
    expect(hub).toContain("AlertTriangle");
    expect(hub).toContain("HubQuickFactsGrid");
    expect(hub).not.toMatch(/topic\.emoji/);
  });

  it("FAQ page uses details accordion with search", () => {
    const page = readFileSync(join(root, "app/faq/page.tsx"), "utf8");
    expect(page).toContain("FaqAccordionSection");
    expect(page).not.toContain("<dl");
    const accordion = readFileSync(join(root, "components/faq/FaqAccordionSection.tsx"), "utf8");
    expect(accordion).toContain("<details");
    expect(accordion).toContain('type="search"');
    expect(accordion).toContain("focus-visible:ring-2");
  });

  it("contacts page has map embed, team block and no form skeleton", () => {
    const client = readFileSync(join(root, "components/contacts/ContactsPageClient.tsx"), "utf8");
    expect(client).toContain("ContactOfficeMap");
    expect(client).toContain("ContactTeamBlock");
    expect(client).not.toContain("Suspense");
    expect(client).not.toContain("animate-pulse");
    const map = readFileSync(join(root, "components/contacts/ContactOfficeMap.tsx"), "utf8");
    expect(map).toContain("<iframe");
    expect(map).toContain("mapEmbedUrl");
    const page = readFileSync(join(root, "app/contacts/page.tsx"), "utf8");
    expect(page).toContain("formContext");
  });

  it("guide pillar pages export per-page OG and Twitter metadata", () => {
    const page = readFileSync(join(root, "app/guide/[slug]/page.tsx"), "utf8");
    expect(page).toContain("buildPublicPageMetadata");
    expect(page).toContain("getGuideTopicHeroImage");
    const meta = buildPublicPageMetadata({
      title: "Экономика и деньги",
      description: "Тест",
      path: "/guide/ekonomika-i-dengi",
      image: "/media/guide/ekonomika-i-dengi/hero.jpg",
    });
    expect(meta.twitter?.title).toBe("Экономика и деньги");
    const ogImages = meta.openGraph?.images;
    const firstOg =
      ogImages == null
        ? undefined
        : Array.isArray(ogImages)
          ? ogImages[0]
          : ogImages;
    expect(firstOg).toBeTruthy();
  });
});
