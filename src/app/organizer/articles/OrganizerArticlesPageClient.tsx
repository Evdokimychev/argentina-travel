"use client";

import { Suspense } from "react";
import OrganizerShell from "@/components/organizer/OrganizerShell";
import OrganizerArticlesListClient from "@/components/organizer/OrganizerArticlesListClient";
import { Skeleton } from "@/components/ui/skeleton";
import { cabinetCardClass } from "@/lib/cabinet-ui";
import { cn } from "@/lib/cn";

function LoadingFallback() {
  return (
    <div className={cn(cabinetCardClass, "p-6")} aria-busy="true">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="mt-4 h-4 w-48" />
    </div>
  );
}

export default function OrganizerArticlesPageClient() {
  return (
    <OrganizerShell>
      <Suspense fallback={<LoadingFallback />}>
        <OrganizerArticlesListClient />
      </Suspense>
    </OrganizerShell>
  );
}
