"use client";

import Link from "next/link";
import { linkifyBlogText } from "@/lib/blog-internal-links";

type LinkifiedTextProps = {
  text: string;
  className?: string;
  as?: "p" | "span";
};

export function LinkifiedText({ text, className, as = "p" }: LinkifiedTextProps) {
  const segments = linkifyBlogText(text);
  const Tag = as;

  return (
    <Tag className={className}>
      {segments.map((segment, index) =>
        segment.type === "link" ? (
          <Link
            key={`${segment.href}-${index}`}
            href={segment.href}
            className="font-medium text-sky underline decoration-sky/30 underline-offset-2 hover:decoration-sky"
          >
            {segment.label}
          </Link>
        ) : (
          <span key={`text-${index}`}>{segment.value}</span>
        ),
      )}
    </Tag>
  );
}
