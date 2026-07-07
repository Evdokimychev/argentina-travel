import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { clientIpFromRequest, writeAdminAuditLog } from "@/lib/admin/audit";
import { normalizeSocialFeedConfig } from "@/lib/social-feed/config-normalize";
import { getDefaultSocialFeedConfig } from "@/lib/social-feed/config-seed";
import {
  loadSocialFeedConfig,
  saveSocialFeedConfig,
} from "@/lib/social-feed/config-server";
import type { SocialFeedConfig } from "@/types/social-feed-config";

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "content.edit");
  if (!auth.ok) return auth.response;

  const config = await loadSocialFeedConfig();
  const seed = getDefaultSocialFeedConfig();

  return NextResponse.json({
    config,
    seed,
    settingsKey: "site.social_feed",
  });
}

export async function PUT(request: Request) {
  const auth = await authorizeAdminRequest(request, "content.edit");
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as { config?: SocialFeedConfig };
  if (!body.config) {
    return NextResponse.json({ error: "config обязателен" }, { status: 400 });
  }

  const normalized = normalizeSocialFeedConfig(body.config);
  const result = await saveSocialFeedConfig(normalized, auth.actorId);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  await writeAdminAuditLog({
    actorUserId: auth.actorId,
    action: "social_feed.update",
    entityType: "site_settings",
    entityId: "site.social_feed",
    payload: {
      sources: normalized.sources.length,
      posts: normalized.posts.length,
      placements: normalized.placements.length,
    },
    ipAddress: clientIpFromRequest(request),
  });

  return NextResponse.json({ config: normalized });
}
