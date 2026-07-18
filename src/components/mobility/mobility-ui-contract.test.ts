import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const inventorySource = readFileSync(
  "src/components/mobility/MobilityInventoryWorkspace.tsx",
  "utf8",
);
const catalogSource = readFileSync(
  "src/components/mobility/MobilityCatalogClient.tsx",
  "utf8",
);

describe("mobility owner-facing UI contract", () => {
  it("keeps public requests CAPTCHA-protected and retry-safe", () => {
    expect(catalogSource).toContain('<TurnstileField formId="native_booking"');
    expect(catalogSource).toContain('name="website"');
    expect(catalogSource).toContain('"Idempotency-Key": idempotencyKeyRef.current');
    expect(catalogSource).toContain("operationId: operationIdRef.current");
    expect(catalogSource).toContain("if (!selected || sendingRef.current) return");
    expect(catalogSource).toContain("Связь прервалась. Повторите отправку — дубликат заявки не создастся.");
  });

  it("accepts ordinary money values and translates lifecycle decisions", () => {
    expect(inventorySource).toContain('name="rateMajor"');
    expect(inventorySource).toContain("majorToMinor(values.get(\"rateMajor\"))");
    expect(inventorySource).toContain('draft: "Черновик"');
    expect(inventorySource).toContain('review: "На проверке"');
    expect(inventorySource).not.toContain("Цена в копейках/сентаво");
    expect(inventorySource).not.toContain("версия {item.row_version}");
  });

  it("offers country presets without hard-coding the inventory to one country", () => {
    expect(inventorySource).toContain('label: "Аргентина"');
    expect(inventorySource).toContain('label: "Уругвай"');
    expect(inventorySource).toContain('<option value="custom">Другая страна</option>');
    expect(inventorySource).toContain('label="Код раздела"');
  });
});
