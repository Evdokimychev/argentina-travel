import { describe, expect, it, vi } from "vitest";
import { fetchExperienceForAffiliate } from "@/lib/tripster/repository";

function createSupabaseMock(rows: Array<Record<string, unknown>>) {
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn((column: string, value: unknown) => ({
          maybeSingle: vi.fn(async () => {
            const match = rows.find((row) => row[column] === value);
            return { data: match ?? null, error: null };
          }),
        })),
      })),
    })),
  };
}

describe("fetchExperienceForAffiliate", () => {
  it("falls back to experience id parsed from slug suffix", async () => {
    const supabase = createSupabaseMock([
      {
        id: 92278,
        slug: "patagonia-t92278",
        tripster_url: "https://experience.tripster.ru/experience/92278/",
        partner_url: null,
        city_id: 204,
      },
    ]);

    const result = await fetchExperienceForAffiliate(
      supabase as never,
      "legacy-slug-t92278"
    );

    expect(result?.id).toBe(92278);
    expect(result?.slug).toBe("patagonia-t92278");
  });
});
