const ALLOWED_TAGS = new Set([
  "P",
  "BR",
  "STRONG",
  "B",
  "EM",
  "I",
  "U",
  "UL",
  "OL",
  "LI",
  "A",
  "BLOCKQUOTE",
  "DIV",
  "SPAN",
]);

const BLOCKED_TAGS = /<(script|style|iframe|object|embed|form|input|button|textarea|select)[\s>]/gi;

export function isHtmlContent(value: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(value.trim());
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function formatInlineMarkdown(text: string): string {
  let result = escapeHtml(text);
  result = result.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  result = result.replace(/__(.+?)__/g, "<u>$1</u>");
  result = result.replace(/(^|[^*])\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "$1<em>$2</em>");
  return result;
}

function linesToListHtml(lines: string[], tag: "ul" | "ol", strip: RegExp): string {
  const items = lines
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<li>${formatInlineMarkdown(line.replace(strip, ""))}</li>`)
    .join("");
  return `<${tag}>${items}</${tag}>`;
}

function blockToHtml(block: string): string {
  const lines = block.split("\n");
  const parts: string[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();

    if (!line) {
      index += 1;
      continue;
    }

    if (/^[•-]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^[•-]\s+/.test(lines[index].trim())) {
        items.push(lines[index]);
        index += 1;
      }
      parts.push(linesToListHtml(items, "ul", /^[•-]\s+/));
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
        items.push(lines[index]);
        index += 1;
      }
      parts.push(linesToListHtml(items, "ol", /^\d+\.\s+/));
      continue;
    }

    if (/^>\s+/.test(line)) {
      parts.push(`<blockquote><p>${formatInlineMarkdown(line.replace(/^>\s+/, ""))}</p></blockquote>`);
      index += 1;
      continue;
    }

    parts.push(`<p>${formatInlineMarkdown(line)}</p>`);
    index += 1;
  }

  return parts.join("");
}

export function markdownLiteToHtml(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  if (isHtmlContent(trimmed)) return trimmed;

  return trimmed
    .split(/\n{2,}/)
    .map((block) => blockToHtml(block))
    .join("");
}

export function normalizeEditorValue(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return isHtmlContent(trimmed) ? sanitizeHtml(trimmed) : sanitizeHtml(markdownLiteToHtml(trimmed));
}

export function htmlToPlainText(html: string): string {
  if (!html.trim()) return "";
  if (typeof document === "undefined") {
    return html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<\/li>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  const container = document.createElement("div");
  container.innerHTML = html;
  return (container.textContent ?? container.innerText ?? "").replace(/\u00a0/g, " ").trim();
}

export function getPlainTextLength(html: string): number {
  return htmlToPlainText(html).length;
}

function sanitizeNode(node: Node): void {
  const children = Array.from(node.childNodes);

  for (const child of children) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const element = child as HTMLElement;
      const tag = element.tagName;

      if (!ALLOWED_TAGS.has(tag)) {
        while (element.firstChild) {
          element.parentNode?.insertBefore(element.firstChild, element);
        }
        element.remove();
        continue;
      }

      if (tag === "A") {
        const href = element.getAttribute("href") ?? "";
        if (!/^https?:\/\//i.test(href)) {
          element.removeAttribute("href");
        } else {
          element.setAttribute("rel", "noopener noreferrer");
          element.setAttribute("target", "_blank");
        }
        for (const attr of Array.from(element.attributes)) {
          if (!["href", "target", "rel"].includes(attr.name)) {
            element.removeAttribute(attr.name);
          }
        }
      } else {
        for (const attr of Array.from(element.attributes)) {
          element.removeAttribute(attr.name);
        }
      }

      sanitizeNode(element);
      continue;
    }

    if (child.nodeType === Node.COMMENT_NODE) {
      child.remove();
    }
  }
}

export function sanitizeHtml(html: string): string {
  if (!html.trim()) return "";
  // `BLOCKED_TAGS` is a module-level /g regex; `.test()` would carry `lastIndex`
  // across calls and intermittently miss matches. `.replace()` is unconditional
  // and idempotent, so just run it every time.
  html = html.replace(BLOCKED_TAGS, "");

  if (typeof document === "undefined") {
    // Server has no DOM, so the node-level sanitizer can't run. Apply the same
    // structural normalization the client branch performs after DOM sanitization
    // (<div> → <p>) so SSR markup and client hydration produce an identical
    // `dangerouslySetInnerHTML` string. Without this the server kept <div>…</div>
    // while the client emitted <p>…</p>, causing a React hydration mismatch on
    // every rich-text block.
    return html
      .replace(/<div><br><\/div>/gi, "<br>")
      .replace(/<div>/gi, "<p>")
      .replace(/<\/div>/gi, "</p>");
  }

  const template = document.createElement("template");
  template.innerHTML = html;
  sanitizeNode(template.content);

  let result = template.innerHTML;
  result = result.replace(/<div><br><\/div>/gi, "<br>");
  result = result.replace(/<div>/gi, "<p>").replace(/<\/div>/gi, "</p>");
  return result;
}

export function trimHtmlToPlainTextLength(html: string, maxLength: number): string {
  const plain = htmlToPlainText(html);
  if (plain.length <= maxLength) return sanitizeHtml(html);

  if (typeof document === "undefined") {
    return sanitizeHtml(plain.slice(0, maxLength));
  }

  const container = document.createElement("div");
  container.innerHTML = sanitizeHtml(html);

  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let remaining = maxLength;
  const textNodes: Text[] = [];

  while (walker.nextNode()) {
    textNodes.push(walker.currentNode as Text);
  }

  for (const node of textNodes) {
    const value = node.textContent ?? "";
    if (value.length <= remaining) {
      remaining -= value.length;
      continue;
    }

    node.textContent = value.slice(0, remaining);
    remaining = 0;

    let next = node.nextSibling;
    while (next) {
      const toRemove = next;
      next = next.nextSibling;
      toRemove.parentNode?.removeChild(toRemove);
    }
    break;
  }

  return sanitizeHtml(container.innerHTML);
}
