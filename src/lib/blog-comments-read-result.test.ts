import { describe, expect, it, vi } from "vitest";
import { listBlogArticleComments } from "@/lib/blog-comments-server";
import type { Database } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

type Response = { data: unknown; error: unknown };

function clientFor(response: Response) {
  const result = Promise.resolve(response);
  const builder = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    abortSignal: vi.fn(),
    retry: vi.fn(),
    then: result.then.bind(result),
  };
  builder.select.mockReturnValue(builder);
  builder.eq.mockReturnValue(builder);
  builder.order.mockReturnValue(builder);
  builder.abortSignal.mockReturnValue(builder);
  builder.retry.mockReturnValue(builder);
  const from = vi.fn(() => builder);
  return {
    client: { from } as unknown as SupabaseClient<Database>,
    builder,
  };
}

describe("blog comments public read truth", () => {
  it("keeps confirmed empty comments available and disables SDK retries", async () => {
    const { client, builder } = clientFor({ data: [], error: null });
    await expect(listBlogArticleComments(client, "article")).resolves.toEqual([]);
    expect(builder.abortSignal).toHaveBeenCalledOnce();
    expect(builder.retry).toHaveBeenCalledWith(false);
  });

  it("throws typed unavailable for quota and malformed list responses", async () => {
    const quota = clientFor({ data: null, error: { status: 402, message: "restricted" } });
    await expect(listBlogArticleComments(quota.client, "article")).rejects.toMatchObject({
      name: "CmsPublicContentUnavailableError",
      errorClass: "quota",
    });

    const malformed = clientFor({ data: null, error: null });
    await expect(listBlogArticleComments(malformed.client, "article")).rejects.toMatchObject({
      name: "CmsPublicContentUnavailableError",
      errorClass: "unknown",
    });
  });
});
