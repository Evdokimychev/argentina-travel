import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  EMAIL_TEMPLATE_CATALOG,
  renderConstrainedEmailTemplate,
  syntheticVariablesFor,
  type EmailTemplateVariables,
} from "@/lib/notifications/email-template-contract";
import { resolveManagedEmailTemplate } from "@/lib/notifications/email-template-resolver-server";

const mocks = vi.hoisted(() => ({
  maybeSingle: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => {
    const query = {
      select: () => query,
      eq: () => query,
      maybeSingle: mocks.maybeSingle,
    };
    return { from: () => query };
  },
}));

const fallback = {
  subject: "Безопасная тема из кода",
  html: "<p>Безопасный HTML из кода</p>",
  text: "Безопасный текст из кода",
};

describe("managed email template resolver", () => {
  beforeEach(() => {
    mocks.maybeSingle.mockReset();
  });

  it("applies the active version for the requested event only", async () => {
    mocks.maybeSingle.mockResolvedValue({
      data: {
        event_key: "booking.confirmed",
        locale: "ru",
        subject_template: "Заявка №{{booking_number}}: {{tour_title}}",
        body_blocks: [
          { type: "paragraph", text: "Здравствуйте, {{recipient_name}}!" },
          { type: "button", label: "Открыть", urlVariable: "booking_url" },
        ],
      },
      error: null,
    });

    const resolved = await resolveManagedEmailTemplate({
      eventKey: "booking.confirmed",
      locale: "ru",
      variables: syntheticVariablesFor("booking.confirmed"),
      fallback,
    });

    expect(resolved.subject).toBe("Заявка №GA-4821: Патагония без спешки");
    expect(resolved.html).toContain("Здравствуйте, Анна!");
    expect(resolved.text).toContain("Открыть: https://www.goargentina.ru/profile/bookings/example");
  });

  it("falls back on database failure, malformed content and event crossover", async () => {
    mocks.maybeSingle.mockResolvedValueOnce({ data: null, error: { code: "unavailable" } });
    await expect(resolveManagedEmailTemplate({
      eventKey: "booking.confirmed",
      locale: "ru",
      variables: syntheticVariablesFor("booking.confirmed"),
      fallback,
    })).resolves.toBe(fallback);

    mocks.maybeSingle.mockResolvedValueOnce({
      data: {
        event_key: "payment.received",
        locale: "ru",
        subject_template: "Чужое событие",
        body_blocks: [{ type: "paragraph", text: "Не применять" }],
      },
      error: null,
    });
    await expect(resolveManagedEmailTemplate({
      eventKey: "booking.confirmed",
      locale: "ru",
      variables: syntheticVariablesFor("booking.confirmed"),
      fallback,
    })).resolves.toBe(fallback);

    mocks.maybeSingle.mockResolvedValueOnce({
      data: {
        event_key: "booking.confirmed",
        locale: "ru",
        subject_template: "{{unknown_variable}}",
        body_blocks: [{ type: "paragraph", text: "Повреждённый шаблон" }],
      },
      error: null,
    });
    await expect(resolveManagedEmailTemplate({
      eventKey: "booking.confirmed",
      locale: "ru",
      variables: syntheticVariablesFor("booking.confirmed"),
      fallback,
    })).resolves.toBe(fallback);
  });

  it("fails closed when runtime variables are missing or unknown", () => {
    const valid = syntheticVariablesFor("booking.confirmed");
    const missing = { ...valid } as Record<string, string>;
    delete missing.tour_title;
    const unknown = { ...valid, internal_api_key: "not-a-real-secret" };

    expect(renderConstrainedEmailTemplate({
      eventKey: "booking.confirmed",
      locale: "ru",
      subjectTemplate: "Заявка: {{tour_title}}",
      bodyBlocks: [{ type: "paragraph", text: "Заявка №{{booking_number}}" }],
      variables: missing as EmailTemplateVariables<"booking.confirmed">,
    })).toBeNull();
    expect(renderConstrainedEmailTemplate({
      eventKey: "booking.confirmed",
      locale: "ru",
      subjectTemplate: "Заявка: {{tour_title}}",
      bodyBlocks: [{ type: "paragraph", text: "Заявка №{{booking_number}}" }],
      variables: unknown as EmailTemplateVariables<"booking.confirmed">,
    })).toBeNull();
  });

  it("keeps secret-bearing fields out of managed events and the durable insert", () => {
    const serializedCatalog = JSON.stringify(EMAIL_TEMPLATE_CATALOG);
    expect(serializedCatalog).not.toMatch(/api[_-]?key|password|access[_-]?token|refresh[_-]?token|client[_-]?secret/i);

    const delivery = readFileSync(
      join(process.cwd(), "src/lib/notifications/email-delivery.ts"),
      "utf8",
    );
    const insertStart = delivery.indexOf('.from("email_delivery_outbox")\n      .insert({');
    const insertEnd = delivery.indexOf(".select(\"id, from_email", insertStart);
    const outboxInsert = delivery.slice(insertStart, insertEnd);
    expect(insertStart).toBeGreaterThan(0);
    expect(outboxInsert).not.toMatch(/apiKey|authorization|providerMessageId|process\.env/i);
    expect(outboxInsert).toContain("subject: input.subject");
    expect(outboxInsert).toContain("html_body: html");
  });
});
