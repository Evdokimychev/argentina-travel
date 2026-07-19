import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { escapeHtml } from "@/lib/notifications/email-templates";

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("operational email security", () => {
  it("escapes hostile HTML fragments", () => {
    expect(escapeHtml('<img src=x onerror="alert(1)">')).toBe(
      "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;",
    );
  });

  it("queues lead alerts through the durable email outbox", () => {
    const leadNotifier = source("src/lib/leads-notify.ts");
    const delivery = source("src/lib/notifications/email-delivery.ts");

    expect(leadNotifier).toContain("sendOperationalEmail");
    expect(leadNotifier).toContain("renderEmailLayout");
    expect(leadNotifier).not.toContain("api.resend.com");
    expect(delivery).toContain("export async function sendOperationalEmail");
    expect(delivery).toContain('.from("email_delivery_outbox")');
  });

  it("escapes public lead, shop and organizer content before rendering", () => {
    const leadCapture = source("src/lib/lead-capture.ts");
    const shop = source("src/lib/shop-order-notify.ts");
    const organizerRoute = source("src/app/api/organizer-applications/route.ts");
    const moderation = source("src/lib/admin/moderation-notify.ts");

    expect(leadCapture).toContain('escapeHtml(row.message ?? "")');
    expect(leadCapture).toContain("escapeHtml(JSON.stringify(row.context");
    expect(shop).toContain("escapeHtml(order.notes)");
    expect(shop).toContain("escapeHtml(order.customerName)");
    expect(organizerRoute).toContain("escapeHtml(description)");
    expect(moderation).toContain("safeApplicantName = escapeHtml(input.applicantName)");
    expect(moderation).toContain("safeNote = input.note ? escapeHtml(input.note)");
    expect(moderation).not.toContain("api.resend.com");
  });
});
