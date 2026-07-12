import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { renderMarkdown } from "./knowledge-base/markdown";

describe("knowledge-base markdown renderer", () => {
  it("renders pipe-prefixed text that is not a markdown table", () => {
    const html = renderToStaticMarkup(
      renderMarkdown("| Цена зависит от сезона", { validIds: new Set() }),
    );

    expect(html).toContain("Цена зависит от сезона");
  });
});
