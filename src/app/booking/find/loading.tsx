import BookingLookupSkeleton from "@/components/booking/BookingLookupSkeleton";

export default function BookingFindLoading() {
  return (
    <div className="min-h-[calc(100vh-var(--site-header-full-height,72px))] bg-pampas">
      <BookingLookupSkeleton />
    </div>
  );
}
