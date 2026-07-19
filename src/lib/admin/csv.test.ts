import { describe, expect, it } from "vitest";
import { escapeCsvCell } from "@/lib/admin/csv";

describe("escapeCsvCell", () => {
  it.each(["=1+1", "+SUM(A1:A2)", "-2+3", "@IMPORTXML(A1)", "  =cmd|'/C calc'!A0"])(
    "neutralizes spreadsheet formulas in %s",
    (value) => {
      expect(escapeCsvCell(value)).toBe(`'${value}`);
    }
  );

  it("quotes commas, quotes and line breaks", () => {
    expect(escapeCsvCell('Иван, "тур"\nстрока')).toBe('"Иван, ""тур""\nстрока"');
  });

  it("does not modify an ordinary value", () => {
    expect(escapeCsvCell("reader@example.com")).toBe("reader@example.com");
  });
});
