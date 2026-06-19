"use client";

import { cn } from "@/lib/cn";
import {
  type AdminStatusChipDomain,
  resolveAdminStatusChip,
} from "@/lib/admin/status-chips";

export default function AdminStatusChip({
  domain,
  value,
  label,
  size = "sm",
  className,
}: {
  domain: AdminStatusChipDomain;
  value: string;
  label?: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const resolved = resolveAdminStatusChip(domain, value);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-semibold ring-1 ring-inset",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs",
        resolved.tone,
        className
      )}
    >
      {label ?? resolved.label}
    </span>
  );
}
