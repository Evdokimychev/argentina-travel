import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

const TURNSTILE_CALLSITES = [
  "src/components/contacts/ContactsPageClient.tsx",
  "src/components/FooterNewsletter.tsx",
  "src/components/blog/BlogNewsletterBlock.tsx",
  "src/components/apartments/ApartmentInquiryForm.tsx",
  "src/components/mobility/MobilityCatalogClient.tsx",
  "src/components/tour-detail/TourWaitlistModal.tsx",
  "src/components/shop/ShopCheckoutModal.tsx",
  "src/components/tour-detail/checkout/TourCheckoutModal.tsx",
  "src/components/tour-detail/TourPriceRequestModal.tsx",
  "src/components/excursions/ExcursionBookingContactSection.tsx",
  "src/components/tour-detail/PartnerTourBookingContactSection.tsx",
] as const;

describe("Turnstile single-use token lifecycle", () => {
  it("resets the rendered widget and clears the consumed token", () => {
    const field = source("src/components/forms/TurnstileField.tsx");

    expect(field).toContain("resetSignal?: number");
    expect(field).toContain('onToken("")');
    expect(field).toContain("window.turnstile.reset(widgetRef.current)");
    expect(field).toContain("previousResetSignalRef.current === resetSignal");
  });

  it("requires a fresh challenge after every attempt in all public callsites", () => {
    for (const file of TURNSTILE_CALLSITES) {
      const component = source(file);
      expect(component, file).toContain("resetSignal={captchaResetSignal}");
      expect(component, file).toContain("setCaptchaResetSignal((signal) => signal + 1)");
    }
  });

  it("keeps the callsite inventory complete", () => {
    const componentsRoot = path.join(process.cwd(), "src/components");
    const files: string[] = [];

    function visit(directory: string) {
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const absolute = path.join(directory, entry.name);
        if (entry.isDirectory()) visit(absolute);
        if (entry.isFile() && entry.name.endsWith(".tsx")) {
          const contents = fs.readFileSync(absolute, "utf8");
          if (contents.includes("<TurnstileField")) {
            files.push(path.relative(process.cwd(), absolute));
          }
        }
      }
    }

    visit(componentsRoot);
    expect(files.sort()).toEqual([...TURNSTILE_CALLSITES].sort());
  });
});
