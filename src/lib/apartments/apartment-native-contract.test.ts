import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { parseApartmentDraftInput } from "@/lib/apartments/apartment-validation";

const root = process.cwd();
const migration = fs.readFileSync(path.join(root, "supabase/migrations/20260717040000_apartments_native.sql"), "utf8");
const source = (file: string) => fs.readFileSync(path.join(root, file), "utf8");
const valid = { marketId: "ar", countryCode: "AR", slug: "palermo-loft", propertyTimezone: "America/Argentina/Buenos_Aires", title: "Лофт в Палермо", summary: "Тихий лофт рядом с парками и кафе.", description: "Уютный вариант для самостоятельной поездки. Полное описание объекта, условий проживания, доступа к инфраструктуре и особенностей района.", locality: "Buenos Aires", region: "CABA", publicLocationNote: "Palermo, рядом с парком", publicLatitude: -34.58, publicLongitude: -58.42, exactAddress: "Private street 123", accessInstructions: "Сообщить после подтверждения", maxGuests: 2, bedrooms: 1, beds: 1, bathrooms: 1, amenities: ["Wi-Fi"], houseRules: ["Не курить"], nightlyPriceMinor: 12500, currency: "USD", minimumStayNights: 2, depositMinor: 10000, depositDisclosure: "Возвращается после выезда", cancellationDisclosure: "Бесплатная отмена до согласованного срока", images: [{ mediaRef: "/media/apartments/loft.jpg", altText: "Гостиная лофта", rightsHolder: "Владелец объекта", licenseCode: "owned", position: 0 }] };

describe("native apartments M1", () => {
  it("uses stable multi-market and request-first contracts", () => {
    expect(migration).toContain("unique (market_id, slug)");
    expect(migration).toContain("on conflict (apartment_id, idempotency_key_hash) do nothing");
    expect(migration).toContain("insert into public.admin_notifications");
    expect(migration).toContain("p_expected_version integer");
    expect(migration).toContain("v_listing.owner_user_id <> p_actor_user_id");
    expect(migration).toContain("country_code text not null");
    expect(migration).toContain("property_timezone text not null");
    expect(migration).toContain("booking_mode text not null default 'native_request'");
    expect(migration).toContain("availability_mode text not null default 'managed_calendar'");
    expect(migration).toContain("price_currency_snapshot");
    expect(migration).toContain("public_latitude = round(public_latitude, 2)");
    expect(migration).toContain("status in ('draft', 'review', 'published', 'archived')");
  });

  it("prevents double allocation and keeps planned providers inert", () => {
    expect(migration).toMatch(/exclude using gist[\s\S]*stay_range with &&/);
    expect(migration).toContain("where (status in ('blocked', 'confirmed'))");
    expect(migration).toContain("'booking_com', 'affiliate_handoff', 'planned', false");
    expect(migration).toContain("'yandex_travel', 'affiliate_handoff', 'planned', false");
    expect(migration).not.toContain("booking_link");
  });

  it("makes lifecycle mutations CAS, actor-bound and atomic with audit", () => {
    expect(migration).toContain("APARTMENT_VERSION_CONFLICT");
    expect(migration).toContain("v_listing.owner_user_id <> p_actor_user_id");
    expect(migration).toContain("insert into public.admin_audit_log");
    expect(migration).toContain("insert into public.moderation_queue");
    expect(migration).toContain("grant execute on function public.apartment_moderate");
    expect(migration).toContain("to service_role");
  });

  it("accepts a valid owner draft and rejects unsafe media/location inputs", () => {
    expect(parseApartmentDraftInput(valid).ok).toBe(true);
    expect(parseApartmentDraftInput({ ...valid, publicLongitude: null }).ok).toBe(false);
    expect(parseApartmentDraftInput({ ...valid, images: [{ ...valid.images[0], rightsHolder: "" }] }).ok).toBe(false);
    expect(parseApartmentDraftInput({ ...valid, depositDisclosure: "" }).ok).toBe(false);
  });

  it("never selects exact address or contacts in public DTO/SEO", () => {
    const repository = source("src/lib/apartments/apartment-repository-server.ts");
    const publicPage = source("src/app/apartments/[slug]/page.tsx");
    const publicColumns = repository.match(/const PUBLIC_COLUMNS = ([^;]+);/)?.[0] ?? "";
    expect(publicColumns).not.toContain("exact_address");
    expect(publicColumns).not.toContain("owner_user_id");
    expect(publicColumns).not.toContain("guest_email");
    expect(publicColumns).not.toContain("rights_holder");
    expect(publicColumns).not.toContain("rights_source_url");
    expect(publicPage).not.toContain("exactAddress");
    expect(publicPage).not.toContain("ownerUserId");
  });

  it("guards organizer ownership, entitlement, captcha and idempotency", () => {
    const auth = source("src/lib/apartments/apartment-auth-server.ts");
    const organizer = source("src/app/api/organizer/apartments/[id]/availability/route.ts");
    const inquiry = source("src/app/api/apartments/[slug]/inquiries/route.ts");
    expect(auth).toContain('"module.apartments.manage"');
    expect(organizer).toContain('.eq("owner_user_id", auth.user.id)');
    expect(inquiry).toContain('formId: "native_booking"');
    expect(inquiry).toContain('request.headers.get("idempotency-key")');
    expect(inquiry).toContain('status: "awaiting_confirmation"');
    expect(inquiry).not.toMatch(/payment|оплат/iu);
  });

  it("gates tourist catalog, detail, inquiry and sitemap by publication and module mode", () => {
    const catalog = source("src/app/apartments/page.tsx");
    const detail = source("src/app/apartments/[slug]/page.tsx");
    const repository = source("src/lib/apartments/apartment-repository-server.ts");
    const sitemap = source("src/lib/sitemap-urls.ts");
    expect(catalog).toContain('modules.apartmentsMode !== "native_request"');
    expect(detail).toContain('modules.apartmentsMode !== "native_request"');
    expect(repository).toContain('.eq("status", "published")');
    expect(sitemap).toContain("collectApartmentSitemapPaths");
    expect(sitemap).toContain("listPublishedApartments");
  });

  it("lets organizers submit but never self-publish", () => {
    const submit = source("src/app/api/organizer/apartments/[id]/submit/route.ts");
    const moderation = source("src/app/api/admin/apartments/[id]/moderate/route.ts");
    expect(submit).toContain("apartment_submit_for_review");
    expect(submit).not.toContain("apartment_moderate");
    expect(moderation).toContain('authorizeAdminRequest(request, "marketplace.moderation")');
    expect(moderation).toContain("p_expected_version");
  });

  it("keeps public module kill switch fail-closed", () => {
    const policy = source("src/lib/public-module-policy-server.ts");
    const inquiry = source("src/app/api/apartments/[slug]/inquiries/route.ts");
    expect(policy).toContain('module === "apartments"');
    expect(policy).toContain('apartmentsMode === "native_request"');
    expect(inquiry).toContain('enforcePublicModuleAccess("apartments", "public_write")');
  });
});
