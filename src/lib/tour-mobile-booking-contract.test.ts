import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const tourDetailRoot = join(process.cwd(), "src/components/tour-detail");

function source(fileName: string): string {
  return readFileSync(join(tourDetailRoot, fileName), "utf8");
}

describe("tour mobile booking contract", () => {
  it("keeps the collapsed booking bar app-sized and accessible", () => {
    const mobileBar = source("MobileBookingBar.tsx");
    expect(mobileBar).toContain('className="flex min-h-12 items-center gap-2"');
    expect(mobileBar).toContain("aria-expanded={expanded}");
    expect(mobileBar).toContain('aria-controls="mobile-booking-controls"');
    expect(mobileBar).toContain("showDepartureCalendar={false}");
  });

  it("does not squeeze the mobile title or duplicate mobile thumbnails", () => {
    const header = source("TourDetailHeader.tsx");
    const gallery = source("TourDetailGallery.tsx");
    expect(header).toContain('className="mt-4 font-display text-3xl');
    expect(header).not.toContain("min-w-0 flex-1 font-display");
    expect(gallery).not.toContain("GalleryThumbnailStrip");
  });

  it("shows the review prompt only for an eligible completed trip", () => {
    const banner = source("ReviewPromptBanner.tsx");
    expect(banner).toContain("resolveReviewEligibility");
    expect(banner).toContain("if (!eligibleForReview || dismissed) return null");
  });

  it("uses 44px primary touch targets in booking controls", () => {
    const guestCounter = source("GuestCounter.tsx");
    const calendar = source("TourDepartureCalendar.tsx");
    const selector = source("BookingDateSelector.tsx");
    expect(guestCounter.match(/h-11 w-11/g)).toHaveLength(2);
    expect(calendar.match(/h-11 w-11/g)).toHaveLength(2);
    expect(calendar).toContain("disabled={!currentOrFuture}");
    expect(selector.match(/min-h-11 flex-1/g)).toHaveLength(2);
  });

  it("uses a solid modal-like mobile booking layer and compact action copy", () => {
    const mobileBar = source("MobileBookingBar.tsx");
    const ui = readFileSync(join(process.cwd(), "src/lib/tour-detail-ui.ts"), "utf8");

    expect(mobileBar).toContain("bg-charcoal/25 lg:hidden");
    expect(mobileBar).toContain("data-mobile-booking-bar");
    expect(mobileBar).toContain('? "Продолжить"');
    expect(mobileBar).toContain("ariaLabel={primaryLabel}");
    expect(ui).toContain("bg-surface-elevated shadow-elevated");
    expect(ui).not.toContain("bg-surface-elevated/95");
  });
});
