import { describe, expect, it } from "vitest";
import { kbCrumbsToJsonLdItems } from "@/lib/knowledge-base/kb-breadcrumbs-json-ld";

describe("kb-breadcrumbs-json-ld", () => {
  it("trims long chains to last three items for Yandex", () => {
    const items = kbCrumbsToJsonLdItems([
      { label: "Главная", href: "/" },
      { label: "База знаний", href: "/baza-znaniy" },
      { label: "Путешествия", href: "/baza-znaniy/razdel/puteshestviya" },
      { label: "Патагония", href: "/baza-znaniy/patagonia" },
    ]);
    expect(items).toHaveLength(3);
    expect(items[0]?.name).toBe("База знаний");
    expect(items[2]?.name).toBe("Патагония");
  });
});
