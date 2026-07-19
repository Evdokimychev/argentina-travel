import { describe, expect, it } from "vitest";
import { validateExternalUrl } from "@/lib/ingestion/safe-fetch";

describe("safe ingestion fetch", () => {
  it("blocks local and credential-bearing URLs before a request", async () => {
    await expect(validateExternalUrl("http://localhost/private")).rejects.toThrow("LOCAL_ADDRESS_FORBIDDEN");
    await expect(validateExternalUrl("https://user:pass@example.com/")).rejects.toThrow("URL_CREDENTIALS_FORBIDDEN");
  });

  it("blocks unsupported protocols", async () => {
    await expect(validateExternalUrl("file:///etc/passwd")).rejects.toThrow("UNSUPPORTED_URL_PROTOCOL");
  });
});
