import "server-only";

import { NextResponse } from "next/server";
import { isPublicPathEnabled, isTravelModulePathEnabled } from "@/lib/public-module-visibility";
import { fetchSiteModuleControlSnapshot } from "@/lib/site-settings-server";

/**
 * Sprint 7 — dormant surface quarantine.
 * Hidden/unpublished modules must not keep serving public read/write APIs.
 * Uses the launch-guarded control plane (same source as public pages), not raw CMS.
 * Admin routes are out of scope (callers stay on /api/admin/**).
 */
export async function rejectIfPublicModuleQuarantined(
  publicPath: string,
  options: { labelRu: string } = { labelRu: "Модуль" },
): Promise<NextResponse | null> {
  const snapshot = await fetchSiteModuleControlSnapshot();
  // Fail closed: cold/unavailable settings must not reopen dormant APIs.
  if (!snapshot.ok) {
    return NextResponse.json(
      { error: `${options.labelRu} отключён`, code: "MODULE_QUARANTINED" },
      {
        status: 404,
        headers: {
          "Cache-Control": "private, no-store",
          "X-Robots-Tag": "noindex, nofollow",
        },
      },
    );
  }

  if (!isPublicPathEnabled(publicPath, snapshot.navigation, snapshot.modules)) {
    return NextResponse.json(
      { error: `${options.labelRu} отключён`, code: "MODULE_QUARANTINED" },
      {
        status: 404,
        headers: {
          "Cache-Control": "private, no-store",
          "X-Robots-Tag": "noindex, nofollow",
        },
      },
    );
  }
  if (!isTravelModulePathEnabled(publicPath, snapshot.modules)) {
    return NextResponse.json(
      { error: `${options.labelRu} отключён`, code: "MODULE_QUARANTINED" },
      {
        status: 404,
        headers: {
          "Cache-Control": "private, no-store",
          "X-Robots-Tag": "noindex, nofollow",
        },
      },
    );
  }
  return null;
}
