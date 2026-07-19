import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ContentProviderError,
  publishProviderVariant,
  verifyProviderConnection,
  type ProviderCredentials,
} from "@/lib/content-factory/provider-clients";

const telegramCredentials: ProviderCredentials = {
  provider: "telegram",
  connectionId: "connection-1",
  externalAccountId: null,
  handle: "@goargentina",
  config: { chatId: "@goargentina" },
  secrets: { bot_token: "1234567890:telegram-test-token" },
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("content factory provider clients", () => {
  it("verifies Telegram with getMe and returns the public bot name", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ ok: true, result: { id: 1, username: "argentina_editor_bot" } }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(verifyProviderConnection(telegramCredentials)).resolves.toEqual({
      accountLabel: "@argentina_editor_bot",
    });
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("/getMe");
  });

  it("sends a Telegram image and puts long text into follow-up messages", async () => {
    const fetchMock = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true, result: { message_id: 41 } }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true, result: { message_id: 42 } }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await publishProviderVariant(telegramCredentials, {
      format: "post",
      body: "А".repeat(1100),
      mediaUrls: ["https://www.goargentina.ru/media/test.jpg"],
      linkUrl: null,
      target: null,
      providerOptions: {},
    });
    expect(result).toEqual(expect.objectContaining({
      externalId: "41",
      externalUrl: "https://t.me/goargentina/41",
    }));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("/sendPhoto");
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain("/sendMessage");
  });

  it("rejects a private Instagram media URL before calling Meta", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetchMock);
    const credentials: ProviderCredentials = {
      provider: "instagram",
      connectionId: "connection-2",
      externalAccountId: "17841400000000000",
      handle: "@goargentina",
      config: { apiVersion: "v25.0" },
      secrets: { access_token: "instagram-access-token" },
    };

    await expect(publishProviderVariant(credentials, {
      format: "post",
      body: "Проверенный текст",
      mediaUrls: ["http://localhost/private.jpg"],
      linkUrl: null,
      target: null,
      providerOptions: {},
    })).rejects.toMatchObject({ code: "INSTAGRAM_MEDIA_NOT_PUBLIC" } satisfies Partial<ContentProviderError>);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("uses a WhatsApp template for an approved marketing message", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ messages: [{ id: "wamid.123" }] }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const credentials: ProviderCredentials = {
      provider: "whatsapp",
      connectionId: "connection-3",
      externalAccountId: null,
      handle: null,
      config: { apiVersion: "v25.0", phoneNumberId: "123456789" },
      secrets: { access_token: "whatsapp-access-token" },
    };

    await publishProviderVariant(credentials, {
      format: "template",
      body: "Не попадает в свободный текст",
      mediaUrls: [],
      linkUrl: null,
      target: "5491112345678",
      providerOptions: { templateName: "tour_follow_up", languageCode: "ru" },
    });
    const request = fetchMock.mock.calls[0]?.[1];
    const body = JSON.parse(String(request?.body)) as { type: string; template: { name: string } };
    expect(body).toEqual(expect.objectContaining({ type: "template", template: { name: "tour_follow_up", language: { code: "ru" } } }));
  });
});
