import { NextResponse } from "next/server";

/**
 * Sprint 7 freeze — unused public API.
 * Quiz narrative is built client-side via `buildPodborNarrative` / `buildPodborMatchResult`.
 * Chat tour-match uses `/api/ai/tour-match`. Do not call this endpoint.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: "Эндпоинт заморожен. Используйте клиентский подбор или /api/ai/tour-match.",
      code: "API_FROZEN",
      replacement: "client:buildPodborNarrative|/api/ai/tour-match",
    },
    {
      status: 410,
      headers: {
        "Cache-Control": "private, no-store",
        Deprecation: "true",
        Sunset: "Wed, 01 Oct 2025 00:00:00 GMT",
      },
    },
  );
}
