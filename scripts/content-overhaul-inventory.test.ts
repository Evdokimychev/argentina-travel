import { describe, expect, it } from "vitest";

import { csvCell, toCsv } from "./content-overhaul-inventory";

describe("content overhaul inventory generator", () => {
  it("escapes CSV values without losing evidence", () => {
    expect(csvCell('Источник "официальный", проверен')).toBe('"Источник ""официальный"", проверен"');
  });

  it("emits the declared header order", () => {
    expect(toCsv(["id", "status"], [{ id: "one", status: "blocked" }])).toBe(
      '"id","status"\n"one","blocked"\n',
    );
  });
});
