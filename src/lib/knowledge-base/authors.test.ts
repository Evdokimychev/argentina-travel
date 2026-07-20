import { describe, expect, it } from "vitest";

import {
  buildKbAuthorProfiles,
  getKbAuthorProfile,
  getKbAuthorSlug,
} from "./authors";
import type { KbEntry } from "./types";

const entry = (overrides: Partial<KbEntry>): KbEntry => ({
  id: "entry",
  type: "author_tip",
  title: "Материал",
  status: "published",
  site_ready: true,
  site_sections: ["zhizn-v-argentine"],
  body: "Текст",
  ...overrides,
});

describe("knowledge-base authors", () => {
  it("groups articles by the explicit author slug", () => {
    const entries = [
      entry({
        id: "one",
        author_name: "Иван",
        author_slug: "ivan",
        personal_experience: true,
        verified_by_ivan: true,
      }),
      entry({
        id: "two",
        author_name: "Иван",
        author_slug: "ivan",
        personal_experience: true,
        verified_by_ivan: true,
      }),
      entry({ id: "editorial" }),
    ];

    const profiles = buildKbAuthorProfiles(entries);
    expect(profiles).toHaveLength(1);
    expect(profiles[0]).toMatchObject({ slug: "ivan", name: "Иван" });
    expect(profiles[0].entries.map((item) => item.id)).toEqual(["one", "two"]);
    expect(getKbAuthorProfile("ivan", entries)?.entries).toHaveLength(2);
  });

  it("excludes unverified bylines and normalizes author routes", () => {
    const unverified = entry({ id: "unverified", author_name: "Не подтверждён" });
    const verified = entry({
      id: "verified",
      author_name: "Иван Автор",
      author_slug: " ../Ivan Profile/ ",
      personal_experience: true,
      verified_by_ivan: true,
    });

    expect(buildKbAuthorProfiles([unverified, verified])).toEqual([
      expect.objectContaining({ slug: "ivan-profile", name: "Иван Автор" }),
    ]);
    expect(getKbAuthorSlug(verified)).toBe("ivan-profile");
  });
});
