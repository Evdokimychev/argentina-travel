import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { renderGuideText } from "./GuidePillarSection";

describe("renderGuideText", () => {
  it("keeps a nested immigration path inside one link", () => {
    const html = renderToStaticMarkup(
      <>{renderGuideText("Подробнее: /immigration/dokumenty-dlya-vyezda")}</>
    );

    expect(html).toContain('href="/immigration/dokumenty-dlya-vyezda"');
    expect(html).not.toContain("/dokumenty-dlya-vyezda</");
  });

  it("transliterates Iguazú for Russian public copy", () => {
    const html = renderToStaticMarkup(<>{renderGuideText("Iguazú")}</>);

    expect(html).toContain("Игуасу");
    expect(html).not.toContain("Iguazú");
  });
});
