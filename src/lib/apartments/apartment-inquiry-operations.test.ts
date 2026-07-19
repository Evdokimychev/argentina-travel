import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  apartmentInquiryMutationError,
  isApartmentInquiryStatus,
} from "@/lib/apartments/apartment-inquiry-operations-server";

const root = process.cwd();
const source = (file: string) => fs.readFileSync(path.join(root, file), "utf8");
const migration = source("supabase/migrations/20260717044000_apartment_inquiry_operations.sql");

describe("apartment inquiry operations", () => {
  it("uses a CAS state machine and atomically owns the confirmed availability block", () => {
    expect(migration).toContain("APARTMENT_INQUIRY_VERSION_CONFLICT");
    expect(migration).toContain("for update");
    expect(migration).toContain("v_inquiry.status = 'awaiting_confirmation'");
    expect(migration).toContain("p_next_status in ('confirmed', 'rejected', 'cancelled')");
    expect(migration).toContain("source = 'confirmed_inquiry'");
    expect(migration).toContain("inquiry_id = v_inquiry.id");
    expect(migration).toContain("insert into public.admin_audit_log");
  });

  it("keeps communication intents durable, PII-free and in the same transaction", () => {
    expect(migration).toContain("create table public.apartment_inquiry_communication_outbox");
    expect(migration).toContain("recipient_kind in ('guest', 'organizer')");
    expect(migration).toContain("insert into public.apartment_inquiry_communication_outbox");
    expect(migration).toContain("payload ?| array['guestEmail', 'guestPhone', 'guestName', 'provider', 'apiKey', 'token']");
    expect(migration).not.toMatch(/jsonb_build_object\([\s\S]{0,500}guest_email/);
  });

  it("limits organizer reads to owned listings while admin uses a capability guard", () => {
    const repository = source("src/lib/apartments/apartment-inquiry-operations-server.ts");
    const organizerList = source("src/app/api/organizer/apartments/inquiries/route.ts");
    const organizerMutation = source("src/app/api/organizer/apartments/inquiries/[id]/route.ts");
    const adminMutation = source("src/app/api/admin/apartments/inquiries/[id]/route.ts");
    expect(repository).toContain('.eq("apartment_listings.owner_user_id", input.ownerUserId)');
    expect(organizerList).toContain("ownerUserId: auth.user.id");
    expect(organizerList).toContain('"Cache-Control": "private, no-store"');
    expect(organizerMutation).toContain("actorIsAdmin: false");
    expect(adminMutation).toContain('"marketplace.moderation"');
    expect(adminMutation).toContain("actorIsAdmin: true");
    expect(source("src/app/api/admin/apartments/inquiries/route.ts")).toContain('auth.via !== "session"');
  });

  it("uses owner-language conflict mapping and a closed status allowlist", () => {
    expect(isApartmentInquiryStatus("confirmed")).toBe(true);
    expect(isApartmentInquiryStatus("paid")).toBe(false);
    expect(apartmentInquiryMutationError({ code: "40001" })).toEqual({
      status: 409,
      message: "Заявка уже изменилась. Обновите список и повторите действие.",
    });
    expect(apartmentInquiryMutationError({ code: "23P01" }).message).toContain("даты уже заняты");
  });

  it("renders an owner-friendly inbox without exposing implementation identifiers", () => {
    const component = source("src/components/apartments/ApartmentInquiryInbox.tsx");
    expect(component).toContain("Заявки на проживание");
    expect(component).toContain("Подтверждение закрывает даты, но не означает оплату");
    expect(component).toContain("Взять в работу");
    expect(component).not.toMatch(/rowVersion\}/);
    expect(component).not.toMatch(/Версия строки|UUID|Supabase|service.role/i);
  });
});
