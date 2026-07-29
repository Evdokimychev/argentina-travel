import ts from "typescript";
import { describe, expect, it } from "vitest";

import {
  csvCell,
  exportedHttpMethods,
  interactionsFromSource,
  routePatternFromAppFile,
  staticExpressionPattern,
  toCsv,
} from "../../scripts/generate-product-surface-inventory";

function source(text: string, fileName = "fixture.tsx") {
  return ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
}

describe("product surface inventory", () => {
  it("normalizes route groups while retaining dynamic segments", () => {
    expect(routePatternFromAppFile("src/app/(public)/tours/[slug]/page.tsx")).toEqual({
      pattern: "/tours/[slug]",
      groups: ["(public)"],
      parallel: [],
      intercepting: [],
    });
  });

  it("extracts exported HTTP methods in canonical order", () => {
    expect(exportedHttpMethods(source("export const POST = () => null; export async function GET() {}"))).toEqual([
      "GET",
      "POST",
    ]);
  });

  it("extracts literal fetch evidence without executing code", () => {
    const fixture = {
      absolutePath: "/fixture.tsx",
      relativePath: "src/components/fixture.tsx",
      text: "fetch('/api/bookings', { method: 'POST' });",
      sourceFile: source("fetch('/api/bookings', { method: 'POST' });"),
      imports: [],
    };
    expect(interactionsFromSource(fixture)).toMatchObject([
      {
        interaction_kind: "http_request",
        http_method: "POST",
        endpoint_pattern: "/api/bookings",
        source_line: "1",
        source_column: "1",
        test_evidence: "source_only",
      },
    ]);
  });

  it("normalizes template URL parameters without executing expressions", () => {
    const fixture = source("fetch(`/api/bookings/${encodeURIComponent(input.bookingId)}/payment`)");
    const statement = fixture.statements[0] as ts.ExpressionStatement;
    const call = statement.expression as ts.CallExpression;

    expect(staticExpressionPattern(call.arguments[0], fixture)).toBe(
      "/api/bookings/[bookingId]/payment",
    );
  });

  it("emits stable RFC4180-style quoted CSV", () => {
    expect(csvCell('a,"b"')).toBe('"a,""b"""');
    expect(toCsv(["id", "status"], [{ id: "one", status: "static" }])).toBe(
      '"id","status"\n"one","static"\n',
    );
  });
});
