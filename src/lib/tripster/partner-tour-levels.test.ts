import { describe, expect, it } from "vitest";
import { resolveTripsterDifficultyLevelFromPayload } from "@/lib/tripster/partner-tour-levels";
import type { TripsterExperience } from "@/lib/tripster/types";

describe("resolveTripsterDifficultyLevelFromPayload", () => {
  it("maps numeric grade to difficulty", () => {
    const experience = { id: 1, grade: 4 } satisfies TripsterExperience;
    expect(resolveTripsterDifficultyLevelFromPayload(experience)).toBe("Высокая");
  });

  it("infers high difficulty from trekking comfort info", () => {
    const experience = {
      id: 2,
      comfort_level_info:
        "<p><strong>Уровень сложности.</strong> Продолжительные треккинги с набором высоты.</p>",
    } satisfies TripsterExperience;

    expect(resolveTripsterDifficultyLevelFromPayload(experience)).toBe("Высокая");
  });

  it("defaults to moderate when no signals exist", () => {
    expect(resolveTripsterDifficultyLevelFromPayload({ id: 3 })).toBe("Умеренная");
  });

  it("infers extreme difficulty from title keywords", () => {
    expect(
      resolveTripsterDifficultyLevelFromPayload({
        id: 4,
        title: "Восхождение на Аконкагуа",
      } satisfies TripsterExperience),
    ).toBe("Экстремальная");
  });
});
