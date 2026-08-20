import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

type MutationContract = {
  file: string;
  modulePath: "/blog" | "/shop" | "/forum";
  mutationStart: string;
  firstWork: string;
  /** Sprint 7 dormant modules use control-plane quarantine helper. */
  style: "legacy_inline" | "quarantine_helper";
};

const CONTRACTS: MutationContract[] = [
  {
    file: "src/app/api/blog/comments/route.ts",
    modulePath: "/blog",
    mutationStart: "export async function POST",
    firstWork: "if (!isSupabaseAuthEnabled())",
    style: "legacy_inline",
  },
  {
    file: "src/app/api/blog/comments/report/route.ts",
    modulePath: "/blog",
    mutationStart: "export async function POST",
    firstWork: "if (!isSupabaseAuthEnabled())",
    style: "legacy_inline",
  },
  {
    file: "src/app/api/shop/orders/route.ts",
    modulePath: "/shop",
    mutationStart: "async function postShopOrder",
    firstWork: "if (!isSupabaseShopEnabled())",
    style: "quarantine_helper",
  },
  {
    file: "src/app/api/forum/categories/[slug]/threads/route.ts",
    modulePath: "/forum",
    mutationStart: "export async function POST",
    firstWork: "if (!isSupabaseForumEnabled())",
    style: "quarantine_helper",
  },
  {
    file: "src/app/api/forum/threads/[threadId]/posts/route.ts",
    modulePath: "/forum",
    mutationStart: "export async function POST",
    firstWork: "if (!isSupabaseForumEnabled())",
    style: "quarantine_helper",
  },
  {
    file: "src/app/api/forum/posts/[postId]/report/route.ts",
    modulePath: "/forum",
    mutationStart: "export async function POST",
    firstWork: "if (!isSupabaseForumEnabled())",
    style: "quarantine_helper",
  },
];

describe("disabled public module mutation routes", () => {
  for (const contract of CONTRACTS) {
    it(`guards ${contract.file} before mutation work`, () => {
      const source = fs.readFileSync(path.join(process.cwd(), contract.file), "utf8");
      const mutationStart = source.indexOf(contract.mutationStart);
      const firstWork = source.indexOf(contract.firstWork, mutationStart);

      expect(mutationStart).toBeGreaterThanOrEqual(0);
      expect(firstWork).toBeGreaterThan(mutationStart);

      if (contract.style === "quarantine_helper") {
        const quarantine = source.indexOf(
          `rejectIfPublicModuleQuarantined("${contract.modulePath}"`,
          mutationStart,
        );
        expect(quarantine).toBeGreaterThan(mutationStart);
        expect(quarantine).toBeLessThan(firstWork);
        expect(source.slice(quarantine, firstWork)).toContain("if (quarantined)");
      } else {
        const settingsRead = source.indexOf(
          "await Promise.all([fetchSiteNavigation(), fetchSiteModules()])",
          mutationStart,
        );
        const visibilityCheck = source.indexOf(
          `isPublicPathEnabled("${contract.modulePath}", navigation, modules)`,
          mutationStart,
        );
        expect(settingsRead).toBeGreaterThan(mutationStart);
        expect(visibilityCheck).toBeGreaterThan(settingsRead);
        expect(firstWork).toBeGreaterThan(visibilityCheck);
        expect(source.slice(visibilityCheck, firstWork)).toContain("status: 404");
      }
    });
  }

  it("keeps authenticated shop-order history reads available when shop is dormant", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "src/app/api/shop/orders/route.ts"),
      "utf8",
    );
    const getStart = source.indexOf("export async function GET");
    const getBody = source.slice(getStart);

    expect(getStart).toBeGreaterThanOrEqual(0);
    expect(getBody).not.toContain("rejectIfPublicModuleQuarantined");
    expect(getBody).not.toContain('isPublicPathEnabled("/shop"');
  });
});
