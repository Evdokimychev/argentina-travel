import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import * as ts from "typescript";
import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();
const srcRoot = join(projectRoot, "src");
const sourceExtensions = new Set([".ts", ".tsx"]);

function listSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return listSourceFiles(path);
    const extension = entry.name.slice(entry.name.lastIndexOf("."));
    return sourceExtensions.has(extension) ? [path] : [];
  });
}

function projectPath(path: string): string {
  return relative(projectRoot, path).replaceAll("\\", "/");
}

function runtimeImportSpecifiers(path: string): string[] {
  const source = readFileSync(path, "utf8");
  const sourceFile = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true);
  const specifiers: string[] = [];

  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement)) {
      if (statement.importClause?.isTypeOnly) continue;
      const bindings = statement.importClause?.namedBindings;
      const onlyTypeBindings =
        bindings &&
        ts.isNamedImports(bindings) &&
        statement.importClause?.name == null &&
        bindings.elements.every((element) => element.isTypeOnly);
      if (onlyTypeBindings) continue;
    } else if (ts.isExportDeclaration(statement)) {
      if (statement.isTypeOnly) continue;
    } else {
      continue;
    }

    if (statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier)) {
      specifiers.push(statement.moduleSpecifier.text);
    }
  }

  return specifiers;
}

function resolveSourceImport(fromPath: string, specifier: string): string | null {
  const base = specifier.startsWith("@/")
    ? join(srcRoot, specifier.slice(2))
    : specifier.startsWith(".")
      ? resolve(dirname(fromPath), specifier)
      : null;
  if (!base) return null;

  for (const candidate of [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    join(base, "index.ts"),
    join(base, "index.tsx"),
  ]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

function findImportChain(entryPath: string, targetPath: string): string[] | null {
  const queue = [[entryPath]];
  const visited = new Set([entryPath]);

  while (queue.length > 0) {
    const chain = queue.shift()!;
    const current = chain.at(-1)!;
    if (current === targetPath) return chain.map(projectPath);

    for (const specifier of runtimeImportSpecifiers(current)) {
      const imported = resolveSourceImport(current, specifier);
      if (!imported || visited.has(imported)) continue;
      visited.add(imported);
      queue.push([...chain, imported]);
    }
  }

  return null;
}

describe("public media client boundary", () => {
  it("keeps the full media resolver out of new public client entries", () => {
    const frozenExceptions = new Set([
      "src/components/contacts/ContactsPageClient.tsx",
    ]);

    const unexpectedImports = listSourceFiles(srcRoot)
      .filter((path) => /^\s*["']use client["'];/u.test(readFileSync(path, "utf8")))
      .filter((path) => !projectPath(path).startsWith("src/components/admin/"))
      .filter((path) => !frozenExceptions.has(projectPath(path)))
      .filter((path) => readFileSync(path, "utf8").includes('from "@/lib/media-resolver"'))
      .map(projectPath);

    expect(unexpectedImports).toEqual([]);
  });

  it("keeps guide hub content serializable across the server-client boundary", () => {
    const guideContent = readFileSync(
      join(srcRoot, "data/guide-hub-index-content.ts"),
      "utf8",
    );
    const guidePage = readFileSync(join(srcRoot, "app/guide/page.tsx"), "utf8");
    const guideView = readFileSync(
      join(srcRoot, "components/guide/GuideHubView.tsx"),
      "utf8",
    );
    const guideTopics = readFileSync(join(srcRoot, "data/guide-topics.ts"), "utf8");
    const guideNav = readFileSync(
      join(srcRoot, "components/guide/GuideSectionNav.tsx"),
      "utf8",
    );

    expect(guideContent).not.toContain("@/lib/media-resolver");
    expect(guideTopics).not.toContain("@/lib/media-resolver");
    expect(guideNav).toContain('from "@/data/guide-paths"');
    expect(guideNav).not.toContain('from "@/data/guide-about-argentina"');
    expect(guidePage).toContain('heroImage={getServicePageHeroImage("guide-hub")}');
    expect(guideView).toContain("GuideHubView({ heroImage }");
  });

  it("keeps immigration content and checkout placeholders outside the media resolver graph", () => {
    const immigrationContent = readFileSync(
      join(srcRoot, "data/immigration-hub-content.ts"),
      "utf8",
    );
    const immigrationPage = readFileSync(join(srcRoot, "app/immigration/page.tsx"), "utf8");
    const immigrationView = readFileSync(
      join(srcRoot, "components/immigration/ImmigrationHubView.tsx"),
      "utf8",
    );
    const checkoutAddons = readFileSync(
      join(srcRoot, "components/tour-detail/checkout/checkout-addons.ts"),
      "utf8",
    );
    const placeholders = readFileSync(
      join(srcRoot, "lib/media/media-placeholders.ts"),
      "utf8",
    );

    expect(immigrationContent).not.toContain("@/lib/media-resolver");
    expect(immigrationContent).not.toContain("heroImage:");
    expect(immigrationPage).toContain("heroImage={getImmigrationHubHeroImage()}");
    expect(immigrationView).toContain("ImmigrationHubView({ heroImage, flightHint }");
    expect(checkoutAddons).toContain('from "@/lib/media/media-placeholders"');
    expect(placeholders).not.toContain("@/lib/media-resolver");
  });

  it("keeps the full manifest outside the protected public client graphs", () => {
    const protectedEntries = [
      "components/guide/GuideHubView.tsx",
      "components/audio-guides/AudioGuidesCatalogView.tsx",
      "components/esim/EsimCatalogView.tsx",
      "components/gallery/GalleryPageView.tsx",
      "components/join/JoinPageView.tsx",
      "components/places/PlaceDetailView.tsx",
      "components/transfers/TransfersSearchView.tsx",
      "components/immigration/ImmigrationHubView.tsx",
      "components/profile/ProfileSavedArticlesPanel.tsx",
      "components/page-builder/blocks/BlogGalleryBlock.tsx",
    ];
    const target = join(srcRoot, "lib/media-resolver.ts");
    const chains = protectedEntries
      .map((entry) => findImportChain(join(srcRoot, entry), target))
      .filter((chain): chain is string[] => chain != null);

    expect(chains).toEqual([]);
  });

  it("keeps full blog and media datasets outside public blog client graphs", () => {
    const publicBlogEntries = [
      "components/blog/BlogCard.tsx",
      "components/blog/BlogEditorialHubs.tsx",
      "components/blog/BlogIndexView.tsx",
      "components/blog/BlogLinkifiedText.tsx",
      "components/blog/BlogReadingHistoryPanel.tsx",
      "components/blog/BlogSidebar.tsx",
    ];
    const forbiddenTargets = [
      "data/blog.ts",
      "data/blog-editorial/patagonia.ts",
      "lib/media-resolver.ts",
      "data/media-library/manifest.json",
      "data/media-library/stock-cache.json",
    ];

    const chains = publicBlogEntries.flatMap((entry) =>
      forbiddenTargets.flatMap((target) => {
        const chain = findImportChain(join(srcRoot, entry), join(srcRoot, target));
        return chain ? [{ entry, target, chain }] : [];
      }),
    );

    expect(chains).toEqual([]);
  });
});
