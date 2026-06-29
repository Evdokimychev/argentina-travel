import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { IMAGE_PLACEHOLDER_LABEL } from "@/components/ui/image-placeholder";

const root = join(process.cwd(), "src");

describe("ImagePlaceholder", () => {
  it("uses unified label constant", () => {
    expect(IMAGE_PLACEHOLDER_LABEL).toBe("Нет фото");
  });

  it("does not use legacy variant-specific copy in the component", () => {
    const source = readFileSync(join(root, "components/ui/image-placeholder.tsx"), "utf8");
    expect(source).not.toMatch(/Фото тура/);
    expect(source).not.toMatch(/Фото направления/);
    expect(source).not.toMatch(/Фото экскурсии/);
  });

  it("PlaceCard uses shared ImagePlaceholder instead of inline copy", () => {
    const source = readFileSync(join(root, "components/places/PlaceCard.tsx"), "utf8");
    expect(source).toContain("ImagePlaceholder");
    expect(source).not.toMatch(/Нет фото/);
  });
});
