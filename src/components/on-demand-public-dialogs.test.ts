import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("public dialog loading", () => {
  it("keeps search and map out of the initial provider render", () => {
    const providers = fs.readFileSync(
      path.join(process.cwd(), "src/components/Providers.tsx"),
      "utf8",
    );
    const onDemand = fs.readFileSync(
      path.join(process.cwd(), "src/components/OnDemandPublicDialogs.tsx"),
      "utf8",
    );

    expect(providers).not.toContain('dynamic(() => import("@/components/SiteSearch")');
    expect(providers).not.toContain("QuickExploreProvider");
    expect(onDemand).toContain("searchMounted ? <SiteSearch /> : null");
    expect(onDemand).toContain("mapMounted ? <QuickExploreDialogHost /> : null");
    expect(onDemand).toContain('from "@/lib/site-map-events"');
    expect(onDemand).not.toContain('from "@/lib/site-map-open"');
  });

  it("loads the static search index only while the dialog is open", () => {
    const search = fs.readFileSync(
      path.join(process.cwd(), "src/components/SiteSearch.tsx"),
      "utf8",
    );
    const context = fs.readFileSync(
      path.join(process.cwd(), "src/context/QuickExploreContext.tsx"),
      "utf8",
    );

    expect(search).toMatch(/useEffect\(\(\) => \{\n\s+if \(!open\) return;[\s\S]+loadSearchIndex/);
    expect(context).not.toContain("scheduleQuickExplorePrefetch");
  });
});
