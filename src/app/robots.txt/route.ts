import { fetchSiteSeo } from "@/lib/site-settings-server";
import { buildRobotsTxtBody } from "@/lib/robots-txt";

export const dynamic = "force-dynamic";

export async function GET() {
  const seo = await fetchSiteSeo();
  const body = buildRobotsTxtBody(seo.allowIndexing);

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
