"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { useAuth } from "@/context/AuthContext";
import { createExternalOrganizerBooking } from "@/lib/bookings-store";
import { getOrganizerTourListingsForUser } from "@/lib/organizer-tour-store";
import { getCatalogSlug } from "@/lib/tour-slug";
import { BOOKING_SOURCE_LABELS, type BookingSource } from "@/types/trip-operations";
import { BOOKINGS_UPDATED_EVENT } from "@/types/tourist";

interface OrganizerCreateExternalBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

const EXTERNAL_SOURCES: BookingSource[] = [
  "tripster",
  "viator",
  "getyourguide",
  "airbnb",
  "other",
];

export default function OrganizerCreateExternalBookingDialog({
  open,
  onOpenChange,
  onCreated,
}: OrganizerCreateExternalBookingDialogProps) {
  const { user } = useAuth();
  const listings = user ? getOrganizerTourListingsForUser(user.id) : [];

  const [listingId, setListingId] = useState(listings[0]?.id ?? "");
  const [bookingSource, setBookingSource] = useState<BookingSource>("tripster");
  const [externalReference, setExternalReference] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [guests, setGuests] = useState("2");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [totalPriceUsd, setTotalPriceUsd] = useState("");
  const [touristComment, setTouristComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedListing = listings.find((item) => item.id === listingId) ?? listings[0];

  function resetForm() {
    setExternalReference("");
    setContactName("");
    setContactEmail("");
    setContactPhone("");
    setGuests("2");
    setStartDate("");
    setEndDate("");
    setTotalPriceUsd("");
    setTouristComment("");
    setError(null);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedListing) {
      setError("Добавьте хотя бы один тур в кабинете организатора");
      return;
    }

    setLoading(true);
    setError(null);

    const result = createExternalOrganizerBooking({
      actor: user,
      organizerTourId: selectedListing.id,
      tourSlug: getCatalogSlug(selectedListing),
      tourTitle: selectedListing.title,
      tourImage: selectedListing.image,
      bookingSource,
      externalReference: externalReference || undefined,
      guests: Number.parseInt(guests, 10) || 1,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      totalPriceUsd: totalPriceUsd ? Number.parseFloat(totalPriceUsd) : undefined,
      contactName,
      contactEmail,
      contactPhone: contactPhone || undefined,
      touristComment: touristComment || undefined,
      status: "confirmed",
    });

    setLoading(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }

    window.dispatchEvent(new CustomEvent(BOOKINGS_UPDATED_EVENT));
    resetForm();
    onOpenChange(false);
    onCreated?.();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogTitle className="font-heading text-xl font-bold text-charcoal">
          Внешнее бронирование
        </DialogTitle>
        <p className="mt-1 text-sm text-slate">
          Добавьте заявку с Tripster или другой площадки — и управляйте подготовкой поездки здесь.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="ext-listing" className="text-sm font-medium text-charcoal">
              Тур / экскурсия
            </label>
            <NativeSelect
              id="ext-listing"
              value={listingId}
              onChange={(event) => setListingId(event.target.value)}
              className="mt-1.5"
            >
              {listings.map((listing) => (
                <option key={listing.id} value={listing.id}>
                  {listing.title}
                </option>
              ))}
            </NativeSelect>
            {selectedListing ? (
              <div className="mt-2 flex items-center gap-2 rounded-xl bg-gray-50 p-2">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg">
                  <Image
                    src={selectedListing.image}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                </div>
                <span className="line-clamp-2 text-xs text-slate">{selectedListing.title}</span>
              </div>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="ext-source" className="text-sm font-medium text-charcoal">
                Площадка
              </label>
              <NativeSelect
                id="ext-source"
                value={bookingSource}
                onChange={(event) => setBookingSource(event.target.value as BookingSource)}
                className="mt-1.5"
              >
                {EXTERNAL_SOURCES.map((source) => (
                  <option key={source} value={source}>
                    {BOOKING_SOURCE_LABELS[source]}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div>
              <label htmlFor="ext-ref" className="text-sm font-medium text-charcoal">
                Номер брони
              </label>
              <Input
                id="ext-ref"
                value={externalReference}
                onChange={(event) => setExternalReference(event.target.value)}
                placeholder="TS-88421"
                className="mt-1.5"
              />
            </div>
          </div>

          <div>
            <label htmlFor="ext-name" className="text-sm font-medium text-charcoal">
              Имя клиента
            </label>
            <Input
              id="ext-name"
              required
              value={contactName}
              onChange={(event) => setContactName(event.target.value)}
              className="mt-1.5"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="ext-email" className="text-sm font-medium text-charcoal">
                Email
              </label>
              <Input
                id="ext-email"
                type="email"
                required
                value={contactEmail}
                onChange={(event) => setContactEmail(event.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <label htmlFor="ext-phone" className="text-sm font-medium text-charcoal">
                Телефон
              </label>
              <Input
                id="ext-phone"
                value={contactPhone}
                onChange={(event) => setContactPhone(event.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="ext-guests" className="text-sm font-medium text-charcoal">
                Гостей
              </label>
              <Input
                id="ext-guests"
                type="number"
                min={1}
                value={guests}
                onChange={(event) => setGuests(event.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <label htmlFor="ext-start" className="text-sm font-medium text-charcoal">
                Начало
              </label>
              <Input
                id="ext-start"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <label htmlFor="ext-end" className="text-sm font-medium text-charcoal">
                Конец
              </label>
              <Input
                id="ext-end"
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>

          <div>
            <label htmlFor="ext-price" className="text-sm font-medium text-charcoal">
              Сумма (USD), необязательно
            </label>
            <Input
              id="ext-price"
              type="number"
              min={0}
              step="0.01"
              value={totalPriceUsd}
              onChange={(event) => setTotalPriceUsd(event.target.value)}
              className="mt-1.5"
            />
          </div>

          <div>
            <label htmlFor="ext-comment" className="text-sm font-medium text-charcoal">
              Комментарий
            </label>
            <textarea
              id="ext-comment"
              rows={2}
              value={touristComment}
              onChange={(event) => setTouristComment(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            />
          </div>

          {error ? (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={loading || !listings.length}>
              {loading ? "Сохранение…" : "Добавить заявку"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function OrganizerCreateExternalBookingButton({
  onCreated,
}: {
  onCreated?: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="rounded-xl"
        onClick={() => setOpen(true)}
      >
        <Plus className="h-4 w-4" />
        Внешнее бронирование
      </Button>
      <OrganizerCreateExternalBookingDialog
        open={open}
        onOpenChange={setOpen}
        onCreated={onCreated}
      />
    </>
  );
}
