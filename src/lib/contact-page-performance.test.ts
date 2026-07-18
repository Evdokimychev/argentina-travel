import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = (file: string) => readFileSync(join(process.cwd(), file), "utf8");

describe("contacts page mobile performance and accessibility", () => {
  const page = source("src/app/contacts/page.tsx");
  const client = source("src/components/contacts/ContactsPageClient.tsx");
  const officeMap = source("src/components/contacts/ContactOfficeMap.tsx");

  it("keeps contextual catalog lookup on the server", () => {
    expect(page).toContain("resolveContactFormContext");
    expect(page).toContain("getTourBySlug");
    expect(client).not.toContain("@/data/tours");
    expect(client).not.toContain("@/data/shop-products");
    expect(client).not.toContain("@/data/services-hub");
  });

  it("uses a compact text hero instead of downloading the decorative 1.6 MB photo", () => {
    expect(client).toContain("pageBandSectionClass");
    expect(client).not.toContain("<Hero");
    expect(client).not.toContain('getServicePageHeroImage("contacts")');
  });

  it("defers the third-party office map until explicit consent", () => {
    expect(officeMap).toContain("useState(false)");
    expect(officeMap).toContain("Открыть карту офиса");
    expect(officeMap).toContain("aria-expanded={open}");
    expect(officeMap).toMatch(/open \? \([\s\S]*<iframe/);
  });

  it("does not use the low-contrast text variants reported by Lighthouse", () => {
    expect(client).not.toContain("text-slate/60");
    expect(client).not.toContain("text-slate/70");
  });
});
