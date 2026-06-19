import BookingTokenPageSkeleton from "@/components/booking/BookingTokenPageSkeleton";

export default function BookingTravelersLoading() {
  return (
    <div className="min-h-[calc(100vh-var(--site-header-full-height,72px))] bg-pampas">
      <BookingTokenPageSkeleton />
    </div>
  );
}
