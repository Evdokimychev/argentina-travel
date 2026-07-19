import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  EMAIL_TEMPLATE_CATALOG,
  renderConstrainedEmailTemplate,
  syntheticVariablesFor,
  validateEmailTemplateDefinition,
} from "@/lib/notifications/email-template-contract";

function source(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

const migration = source("supabase/migrations/20260717039000_email_template_center.sql");

describe("owner email template center", () => {
  it("renders escaped variables only through constrained blocks", () => {
    const rendered = renderConstrainedEmailTemplate({
      eventKey: "booking.confirmed",
      locale: "ru",
      subjectTemplate: "Заявка: {{tour_title}}",
      bodyBlocks: [
        { type: "paragraph", text: "Здравствуйте, {{recipient_name}}" },
        { type: "button", label: "Открыть", urlVariable: "booking_url" },
      ],
      variables: {
        ...syntheticVariablesFor("booking.confirmed"),
        recipient_name: '<img src=x onerror="alert(1)">',
      },
    });
    expect(rendered?.html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
    expect(rendered?.html).not.toContain("<img src=x");
    expect(rendered?.subject).not.toContain("\n");
  });

  it("rejects code, malformed variables, foreign links and unknown events", () => {
    expect(validateEmailTemplateDefinition({
      eventKey: "booking.confirmed",
      locale: "ru",
      subjectTemplate: "Заявка",
      bodyBlocks: [{ type: "paragraph", text: '<script>alert(1)</script>' }],
    })).toMatchObject({ ok: false });
    expect(validateEmailTemplateDefinition({
      eventKey: "booking.confirmed",
      locale: "ru",
      subjectTemplate: "{{secret_key}}",
      bodyBlocks: [{ type: "paragraph", text: "Безопасный текст" }],
    })).toMatchObject({ ok: false });
    expect(validateEmailTemplateDefinition({
      eventKey: "custom.uncontrolled",
      locale: "ru",
      subjectTemplate: "Тема",
      bodyBlocks: [{ type: "paragraph", text: "Текст" }],
    })).toMatchObject({ ok: false });
    expect(renderConstrainedEmailTemplate({
      eventKey: "booking.confirmed",
      locale: "ru",
      subjectTemplate: "Заявка",
      bodyBlocks: [{ type: "button", label: "Фишинг", urlVariable: "booking_url" }],
      variables: { ...syntheticVariablesFor("booking.confirmed"), booking_url: "https://evil.example/steal" },
    })).toBeNull();
  });

  it("keeps the connected catalog explicit and uses synthetic non-PII preview data", () => {
    const connected = EMAIL_TEMPLATE_CATALOG.filter((entry) => entry.connected);
    expect(connected.map((entry) => entry.eventKey)).toEqual([
      "booking.confirmed",
      "booking.status_changed",
      "booking.status_changed_admin",
      "payment.received",
      "messaging.new_message",
      "booking.reminder_24h",
      "trip_prep.reminder",
      "review.moderated",
      "review.organizer_published",
      "privacy.delete_completed",
      "content.freshness_report",
      "notifications.daily_digest",
      "operations.alert",
      "moderation.outcome",
      "organizer.application_approved",
      "organizer.application_rejected",
    ]);
    expect(EMAIL_TEMPLATE_CATALOG.find((entry) => entry.eventKey === "auth.magic_link")?.connected).toBe(false);
    expect(JSON.stringify(EMAIL_TEMPLATE_CATALOG.map((entry) => syntheticVariablesFor(entry.eventKey)))).not.toMatch(/@|\+\d{6,}/);
  });

  it("applies checked database content through the durable central email path", () => {
    const delivery = source("src/lib/notifications/email-delivery.ts");
    const moderation = source("src/lib/admin/moderation-notify.ts");
    const resolver = source("src/lib/notifications/email-template-resolver-server.ts");
    expect(delivery).toContain("resolveManagedEmailTemplate");
    for (const event of EMAIL_TEMPLATE_CATALOG.filter((entry) => entry.connected)) {
      expect(`${delivery}\n${moderation}`).toContain(`eventKey: "${event.eventKey}"`);
    }
    expect(delivery).toContain("sendEmail(config");
    expect(delivery).toContain('.from("email_delivery_outbox")');
    expect(resolver).toContain('.eq("status", "active")');
    expect(resolver).toContain("?? input.fallback");
  });

  it("keeps history immutable and mutations CAS-controlled with atomic audit", () => {
    expect(migration).not.toMatch(/grant delete on table public\.email_template_versions/i);
    expect(migration).toContain("create unique index email_template_one_active_idx");
    expect(migration).toContain("create unique index email_template_one_draft_idx");
    expect(migration).toContain("pg_advisory_xact_lock");
    expect(migration.match(/EMAIL_TEMPLATE_VERSION_CONFLICT/g)?.length).toBeGreaterThanOrEqual(5);
    expect(migration.match(/insert into public\.admin_audit_log/g)?.length).toBe(4);
    expect(migration).toContain("source_version_id");
    expect(migration).toContain("security invoker");
    expect(migration).toContain("from public, anon, authenticated");
    expect(migration).toContain("to service_role");
  });

  it("guards every admin operation and does not expose provider or database failures", () => {
    const route = source("src/app/api/admin/email-templates/route.ts");
    const view = source("src/components/admin/views/AdminEmailTemplatesView.tsx");
    expect(route).toContain('authorizeAdminRequest(request, "system.settings")');
    expect(route).toContain('auth.via !== "session"');
    expect(route).toContain("!catalogEntry.connected");
    expect(route).not.toContain("error.message");
    expect(view).toContain("Письмо не отправляется");
    expect(view).toContain("Системный шаблон: его текст не управляется в этом разделе.");
    expect(view).not.toMatch(/следующ|в разработке|coming soon/i);
    expect(view).not.toContain("test-send");
  });
});
