import { fetchSiteSeo } from "@/lib/site-settings-server";
import { buildRobotsTxtBody, isCanonicalIndexingRequest } from "@/lib/robots-txt";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const seo = await fetchSiteSeo();
  const allowIndexing = seo.allowIndexing && isCanonicalIndexingRequest(request.url);
  const body = buildRobotsTxtBody(allowIndexing);

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
