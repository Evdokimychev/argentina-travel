import { Skeleton } from "@/components/ui/skeleton";

export default function ExcursionBookingPanelSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-10 w-full rounded-xl" />
      <div className="flex gap-2">
        <Skeleton className="h-9 w-16 rounded-xl" />
        <Skeleton className="h-9 w-16 rounded-xl" />
        <Skeleton className="h-9 w-16 rounded-xl" />
      </div>
      <Skeleton className="h-10 w-full rounded-xl" />
      <Skeleton className="h-10 w-full rounded-xl" />
      <Skeleton className="h-11 w-full rounded-xl" />
    </div>
  );
}
