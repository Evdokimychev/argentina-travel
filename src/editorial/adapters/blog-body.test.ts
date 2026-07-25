import { describe, expect, it } from "vitest";
import {
  adaptRichBlockToBody,
  migrateLegacyBlogBodyBlock,
} from "@/editorial/adapters/blog-body";
import { checkEditorialRhythm } from "@/editorial/utilities/rhythm";
import { auditEditorialBlocks } from "@/editorial/utilities/audit";
import { calloutBlockSchema, photoBlockSchema } from "@/editorial/schemas/validators";

describe("editorial adapters", () => {
  it("migrates infobox to callout", () => {
    const migrated = migrateLegacyBlogBodyBlock({
      type: "infobox",
      variant: "warning",
      title: "Важно",
      body: "Текст",
    });
    expect(migrated).toEqual({
      type: "callout",
      variant: "warning",
      title: "Важно",
      body: "Текст",
    });
  });

  it("adapts rich gallery to body gallery", () => {
    const blocks = adaptRichBlockToBody({
      type: "gallery",
      images: [{ src: "/a.jpg", alt: "A", title: "Caption" }],
    });
    expect(blocks[0]).toMatchObject({
      type: "gallery",
      items: [{ src: "/a.jpg", alt: "A", caption: "Caption" }],
    });
  });
});

describe("editorial schemas", () => {
  it("rejects photo without alt", () => {
    const result = photoBlockSchema.safeParse({
      type: "photo",
      src: "/x.jpg",
      alt: "",
    });
    expect(result.success).toBe(false);
  });

  it("accepts callout with title and body", () => {
    const result = calloutBlockSchema.safeParse({
      type: "callout",
      title: "Совет",
      body: "Текст",
    });
    expect(result.success).toBe(true);
  });
});

describe("editorial rhythm + audit", () => {
  it("warns about too many CTAs", () => {
    const warnings = checkEditorialRhythm([
      { type: "cta", label: "A", href: "/a" },
      { type: "cta", label: "B", href: "/b" },
      { type: "cta", label: "C", href: "/c" },
    ]);
    expect(warnings.some((item) => item.code === "too-many-cta")).toBe(true);
  });

  it("flags missing alt", () => {
    const findings = auditEditorialBlocks([
      { type: "photo", src: "/x.jpg", alt: "" },
    ]);
    expect(findings.some((item) => item.code === "missing-alt")).toBe(true);
  });
});
