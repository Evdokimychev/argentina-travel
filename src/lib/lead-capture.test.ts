import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  insert: vi.fn(),
  upsert: vi.fn(),
  notify: vi.fn(),
}));

vi.mock("@/lib/supabase/env", () => ({ isSupabaseConfigured: () => true }));
vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({
    from: () => ({ insert: mocks.insert, upsert: mocks.upsert }),
  }),
}));
vi.mock("@/lib/leads-notify", () => ({ notifyLeadCaptured: mocks.notify }));

import { submitContact, submitNewsletter } from "@/lib/lead-capture";

describe("lead capture persistence notifications", () => {
  beforeEach(() => {
    mocks.insert.mockReset().mockResolvedValue({ error: null });
    mocks.upsert.mockReset().mockResolvedValue({ error: null });
    mocks.notify.mockReset().mockResolvedValue({ status: "accepted", providerMessageId: "mail-1" });
  });

  it("escapes all user-controlled contact values in the notification HTML", async () => {
    await submitContact({
      kind: "general",
      name: '<img src=x onerror="alert(1)">',
      email: "safe@example.com",
      phone: "+54 11 1234 5678",
      message: "<script>alert(1)</script>",
      context: { note: "</pre><script>alert(2)</script>" },
      pageUrl: "/contacts",
    });

    const notification = mocks.notify.mock.calls[0]?.[0] as { html: string };
    expect(notification.html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
    expect(notification.html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(notification.html).toContain("&lt;/pre&gt;&lt;script&gt;alert(2)&lt;/script&gt;");
    expect(notification.html).not.toContain("<script>");
  });

  it("normalizes newsletter values before persistence and email rendering", async () => {
    await submitNewsletter({ email: " Reader@Example.com ", source: "footer" });

    expect(mocks.upsert).toHaveBeenCalledWith(
      {
        email: "reader@example.com",
        source: "footer",
        locale: null,
        status: "active",
      },
      { onConflict: "email" }
    );
    expect(mocks.notify).toHaveBeenCalledWith(
      expect.objectContaining({ subject: "Новая подписка: reader@example.com" })
    );
  });
});
