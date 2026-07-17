import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getPrivateTourSeedForSlug } from "@/data/tour-private-seeds";
import { getDemoBookingSeeds } from "@/lib/bookings-demo-seeds-active";
import { getDemoBookingSeeds as getIsolatedDemoBookingSeeds } from "@/lib/bookings-demo-seeds-active.demo";
import { getDemoReviewSeeds } from "@/lib/reviews-demo-seeds-active";
import { getDemoReviewSeeds as getIsolatedDemoReviewSeeds } from "@/lib/reviews-demo-seeds-active.demo";
import { getDemoWaitlistSeeds } from "@/lib/waitlist-demo-seeds-active";
import { getDemoWaitlistSeeds as getIsolatedDemoWaitlistSeeds } from "@/lib/waitlist-demo-seeds-active.demo";
import { getPrivateTourSeedForSlug as getIsolatedPrivateTourSeed } from "@/data/tour-private-seeds.demo";

const readSource = (file: string) => readFileSync(join(process.cwd(), file), "utf8");

describe("production/demo seed provider isolation", () => {
  it("keeps production providers empty and marker-free", () => {
    expect(getDemoBookingSeeds(new Date(0).toISOString())).toEqual([]);
    expect(getDemoReviewSeeds(new Date(0).toISOString())).toEqual([]);
    expect(getDemoWaitlistSeeds()).toEqual([]);
    expect(getPrivateTourSeedForSlug("fitz-roy-trek")).toBeUndefined();

    for (const file of [
      "src/lib/bookings-demo-seeds-active.ts",
      "src/lib/reviews-demo-seeds-active.ts",
      "src/data/tour-private-seeds.ts",
      "src/lib/waitlist-demo-seeds-active.ts",
    ]) {
      const source = readSource(file);
      expect(source).not.toMatch(/booking-demo|review-demo|trip-demo|demo-fitz|@example\./i);
    }
  });

  it("keeps public stores independent from demo seed modules and literals", () => {
    for (const file of ["src/lib/bookings-store.ts", "src/lib/reviews-store.ts", "src/lib/waitlist-store.ts"]) {
      const source = readSource(file);
      expect(source).not.toMatch(/\.demo(?:\.ts)?["']/);
      expect(source).not.toMatch(/booking-demo|review-demo|trip-demo|demo-fitz|@example\./i);
    }
  });

  it("selects isolated demo providers only in demo builds", () => {
    const config = readSource("next.config.ts");
    expect(config).toContain('"src/lib/bookings-demo-seeds-active.demo.ts"');
    expect(config).toContain('"src/lib/reviews-demo-seeds-active.demo.ts"');
    expect(config).toContain('"src/lib/waitlist-demo-seeds-active.demo.ts"');
    expect(config).toContain('"src/data/tour-private-seeds.demo.ts"');
  });

  it("preserves demo fixtures inside the isolated providers", () => {
    const now = new Date(0).toISOString();
    expect(getIsolatedDemoBookingSeeds(now).length).toBeGreaterThan(0);
    expect(getIsolatedDemoReviewSeeds(now).length).toBeGreaterThan(0);
    expect(getIsolatedDemoWaitlistSeeds().length).toBeGreaterThan(0);
    expect(getIsolatedPrivateTourSeed("fitz-roy-trek")?.isPrivate).toBe(true);
  });
});
