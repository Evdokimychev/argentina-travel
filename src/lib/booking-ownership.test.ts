import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { bookingToRow, rowToBooking, type BookingRow } from "@/lib/bookings-db-mapper";

describe("booking ownership hardening", () => {
  it("keeps the immutable organizer owner through database mapping", () => {
    const row: BookingRow = {
      id: "booking-1",
      user_id: "tourist-1",
      guest_user_id: null,
      organizer_user_id: "organizer-db-owner",
      tour_id: "tour-1",
      tour_slug: "tour-1",
      tour_title: "Тур",
      tour_image: "",
      status: "new",
      guests: 2,
      total_price_usd: 100,
      contact_name: "Турист",
      contact_email: "tourist@example.com",
      contact_phone: "+79990000000",
      start_date: null,
      end_date: null,
      payment_status: null,
      payload: {},
      created_at: "2026-07-16T00:00:00.000Z",
      updated_at: "2026-07-16T00:00:00.000Z",
    };

    const booking = rowToBooking(row);
    expect(booking.organizerUserId).toBe("organizer-db-owner");
    expect(bookingToRow(booking).organizer_user_id).toBe("organizer-db-owner");
  });

  it("removes editable profile email from booking RLS", () => {
    const sql = fs.readFileSync(
      path.join(
        process.cwd(),
        "supabase/migrations/20260716233000_secure_booking_ownership.sql",
      ),
      "utf8",
    );

    expect(sql).not.toContain("public.profiles");
    expect(sql).toContain("user_id = auth.uid()");
    expect(sql).toContain("organizer_user_id = auth.uid()::text");
    expect(sql).toContain("email_confirmed_at is not null");
    expect(sql).toContain('drop policy if exists "bookings_update_owner"');
  });
});
