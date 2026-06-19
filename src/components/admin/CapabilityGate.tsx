"use client";

import { useAdminContext } from "@/context/AdminContext";
import type { AdminCapability } from "@/types/admin";
import { cn } from "@/lib/cn";
import { cabinetPanelClass } from "@/lib/cabinet-ui";

export default function CapabilityGate({
  capability,
  children,
  fallback,
}: {
  capability: AdminCapability;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { hasCapability, loading } = useAdminContext();

  if (loading) {
    return (
      <div className={cn(cabinetPanelClass, "text-sm text-slate")}>Загрузка…</div>
    );
  }

  if (!hasCapability(capability)) {
    return (
      fallback ?? (
        <div className={cn(cabinetPanelClass, "text-sm text-slate")}>
          Нет доступа к этому разделу.
        </div>
      )
    );
  }

  return <>{children}</>;
}
