import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

type MutationContract = {
  file: string;
  modulePath: "/blog" | "/shop" | "/forum";
  mutationStart: string;
  firstWork: string;
};

const CONTRACTS: MutationContract[] = [
  {
    file: "src/app/api/blog/comments/route.ts",
    modulePath: "/blog",
    mutationStart: "export async function POST",
    firstWork: "if (!isSupabaseAuthEnabled())",
  },
  {
    file: "src/app/api/blog/comments/report/route.ts",
    modulePath: "/blog",
    mutationStart: "export async function POST",
    firstWork: "if (!isSupabaseAuthEnabled())",
  },
  {
    file: "src/app/api/shop/orders/route.ts",
    modulePath: "/shop",
    mutationStart: "async function postShopOrder",
    firstWork: "if (!isSupabaseShopEnabled())",
  },
  {
    file: "src/app/api/forum/categories/[slug]/threads/route.ts",
    modulePath: "/forum",
    mutationStart: "export async function POST",
    firstWork: "if (!isSupabaseForumEnabled())",
  },
  {
    file: "src/app/api/forum/threads/[threadId]/posts/route.ts",
    modulePath: "/forum",
    mutationStart: "export async function POST",
    firstWork: "if (!isSupabaseForumEnabled())",
  },
  {
    file: "src/app/api/forum/posts/[postId]/report/route.ts",
    modulePath: "/forum",
    mutationStart: "export async function POST",
    firstWork: "if (!isSupabaseForumEnabled())",
  },
];

describe("disabled public module mutation routes", () => {
  for (const contract of CONTRACTS) {
    it(`guards ${contract.file} before mutation work`, () => {
      const source = fs.readFileSync(path.join(process.cwd(), contract.file), "utf8");
      const mutationStart = source.indexOf(contract.mutationStart);
      const navigationRead = source.indexOf("await fetchSiteNavigation()", mutationStart);
      const visibilityCheck = source.indexOf(
        `isPublicPathEnabled("${contract.modulePath}", navigation)`,
        mutationStart,
      );
      const firstWork = source.indexOf(contract.firstWork, mutationStart);

      expect(mutationStart).toBeGreaterThanOrEqual(0);
      expect(navigationRead).toBeGreaterThan(mutationStart);
      expect(visibilityCheck).toBeGreaterThan(navigationRead);
      expect(firstWork).toBeGreaterThan(visibilityCheck);
      expect(source.slice(visibilityCheck, firstWork)).toContain("status: 404");
    });
  }

  it("keeps existing shop-order reads available", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "src/app/api/shop/orders/route.ts"),
      "utf8",
    );
    const getStart = source.indexOf("export async function GET");

    expect(getStart).toBeGreaterThanOrEqual(0);
    expect(source.slice(getStart)).not.toContain('isPublicPathEnabled("/shop"');
  });
});
