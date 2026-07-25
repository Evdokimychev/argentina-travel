"use client";

import { auditEditorialBlocks } from "@/editorial/utilities/audit";
import type { BlogBodyBlock } from "@/types/blog-content-blocks";
import { cn } from "@/lib/cn";

type Props = {
  block: BlogBodyBlock;
  className?: string;
};

/** Inline audit findings for a single page-builder card (does not block save). */
export default function PageBuilderBlockValidation({ block, className }: Props) {
  const findings = auditEditorialBlocks([block]).filter(
    (finding) => finding.level === "error" || finding.level === "warning",
  );

  if (findings.length === 0) return null;

  const hasError = findings.some((finding) => finding.level === "error");

  return (
    <ul
      className={cn(
        "mt-3 space-y-1 rounded-xl px-3 py-2 text-xs",
        hasError
          ? "border border-red-200 bg-red-50 text-red-800"
          : "border border-amber-200 bg-amber-50 text-amber-900",
        className,
      )}
      aria-live="polite"
    >
      {findings.map((finding, index) => (
        <li key={`${finding.code}-${index}`}>
          <span className="font-medium">
            {finding.level === "error" ? "Ошибка" : "Замечание"}:
          </span>{" "}
          {finding.message}
        </li>
      ))}
    </ul>
  );
}
