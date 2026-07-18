import test from "node:test";
import assert from "node:assert/strict";
import {
  extractSitemapUrls,
  inspectPublicHtml,
  visibleTextFromHtml,
} from "./public-editorial-audit.mjs";

test("extracts and decodes sitemap URLs", () => {
  assert.deepEqual(
    extractSitemapUrls("<urlset><url><loc>https://example.com/tours?a=1&amp;b=2</loc></url></urlset>"),
    ["https://example.com/tours?a=1&b=2"]
  );
});

test("ignores scripts and legitimate Todo proper names", () => {
  const html = `
    <html><head><title>Связь в Аргентине</title><script>const placeholder = true;</script></head>
    <body>Автобусы Sem/Todo Turismo и экскурсия Todo Glaciares.</body></html>
  `;
  assert.equal(visibleTextFromHtml(html).includes("placeholder"), false);
  assert.deepEqual(inspectPublicHtml({ html, status: 200, path: "/guide/svyaz" }).errors, []);
});

test("finds public editorial and AI traces", () => {
  const html = `
    <html><head><title>Материал</title></head>
    <body>Этот раздел скоро появится. Как языковая модель, я подготовил текст.</body></html>
  `;
  const result = inspectPublicHtml({ html, status: 200, path: "/guide/test" });
  assert.deepEqual(result.errors.map((item) => item.code), ["development-copy", "ai-disclosure"]);
});

test("rejects noindex and not-found pages from sitemap", () => {
  const html = `
    <html><head><title>Страница не найдена</title><meta name="robots" content="noindex, follow"></head>
    <body>Вернитесь в путеводитель.</body></html>
  `;
  const result = inspectPublicHtml({ html, status: 200, path: "/missing" });
  assert.deepEqual(result.errors.map((item) => item.code), ["not-found-title", "noindex-in-sitemap"]);
});
