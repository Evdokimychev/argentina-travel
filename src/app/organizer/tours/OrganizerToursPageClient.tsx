"use client";

import { Suspense } from "react";
import OrganizerShell from "@/components/organizer/OrganizerShell";
import OrganizerToursView from "@/components/organizer/OrganizerToursView";
import { Skeleton } from "@/components/ui/skeleton";
import { cabinetCardClass } from "@/lib/cabinet-ui";
import { cn } from "@/lib/cn";

function OrganizerToursLoadingFallback() {
  return (
    <div className={cn(cabinetCardClass, "p-6")} aria-busy="true">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="mt-4 h-4 w-48" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-48 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export default function OrganizerToursPageClient() {
  return (
    <OrganizerShell>
      <Suspense fallback={<OrganizerToursLoadingFallback />}>
        <OrganizerToursView />
      </Suspense>
    </OrganizerShell>
  );
}
