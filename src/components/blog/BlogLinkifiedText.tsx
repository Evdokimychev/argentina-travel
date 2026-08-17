"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { isExternalBlogHref, linkifyBlogText, type BlogInternalLinkRule } from "@/lib/blog-internal-links";

type LinkifiedTextProps = {
  text: string;
  className?: string;
  as?: "p" | "span";
  /** Optional auto-link rules; default = markdown-only (no city spam). */
  rules?: BlogInternalLinkRule[];
};

/** Render a plain segment with **bold**, *italic*, and `code`. */
function renderInlineMarkdownSegment(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let part = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(
        <span key={`${keyPrefix}-t-${part++}`}>{text.slice(lastIndex, match.index)}</span>,
      );
    }
    const token = match[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      nodes.push(
        <strong key={`${keyPrefix}-b-${part++}`}>{token.slice(2, -2)}</strong>,
      );
    } else if (token.startsWith("`") && token.endsWith("`")) {
      nodes.push(
        <code key={`${keyPrefix}-c-${part++}`} className="rounded bg-surface-muted px-1 text-[0.9em]">
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith("*") && token.endsWith("*")) {
      nodes.push(<em key={`${keyPrefix}-i-${part++}`}>{token.slice(1, -1)}</em>);
    } else {
      nodes.push(<span key={`${keyPrefix}-r-${part++}`}>{token}</span>);
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    nodes.push(<span key={`${keyPrefix}-t-${part++}`}>{text.slice(lastIndex)}</span>);
  }

  return nodes.length > 0 ? nodes : [<span key={`${keyPrefix}-empty`}>{text}</span>];
}

const linkClassName =
  "font-medium text-sky-ink underline decoration-sky/30 underline-offset-2 hover:decoration-sky-ink";

function BlogSegmentLink({ href, label }: { href: string; label: string }) {
  if (isExternalBlogHref(href)) {
    return (
      <a href={href} className={linkClassName} rel="noopener noreferrer" target="_blank">
        {label}
      </a>
    );
  }

  return (
    <Link href={href} className={linkClassName}>
      {label}
    </Link>
  );
}

export function LinkifiedText({ text, className, as = "p", rules }: LinkifiedTextProps) {
  const segments = linkifyBlogText(text, rules);
  const Tag = as;

  return (
    <Tag className={className}>
      {segments.map((segment, index) =>
        segment.type === "link" ? (
          <BlogSegmentLink key={`${segment.href}-${index}`} href={segment.href} label={segment.label} />
        ) : (
          <span key={`text-${index}`}>
            {renderInlineMarkdownSegment(segment.value, `seg-${index}`)}
          </span>
        ),
      )}
    </Tag>
  );
}

/** Inline Markdown + optional internal linkify for table cells and callouts. */
export function BlogInlineText({
  text,
  className,
  linkify = false,
  rules,
}: {
  text: string;
  className?: string;
  linkify?: boolean;
  rules?: BlogInternalLinkRule[];
}) {
  if (linkify) {
    return <LinkifiedText text={text} className={className} as="span" rules={rules} />;
  }
  return <span className={className}>{renderInlineMarkdownSegment(text, "inline")}</span>;
}
