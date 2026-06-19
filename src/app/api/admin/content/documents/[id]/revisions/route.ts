import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { listCmsRevisions } from "@/lib/cms/content-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { CmsRevision } from "@/types/cms-content";

type CmsRevisionListItem = CmsRevision & { authorName?: string | null };

async function enrichRevisionAuthors(
  revisions: CmsRevision[],
  supabase: ReturnType<typeof createSupabaseAdminClient>
): Promise<CmsRevisionListItem[]> {
  const authorIds = [
    ...new Set(
      revisions
        .map((revision) => revision.createdBy)
        .filter((id): id is string => Boolean(id))
    ),
  ];

  if (!authorIds.length) return revisions;

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, email")
    .in("id", authorIds);

  const authorNames = new Map<string, string>();
  for (const profile of profiles ?? []) {
    const label =
      [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() ||
      profile.email?.trim() ||
      profile.id.slice(0, 8);
    authorNames.set(profile.id, label);
  }

  return revisions.map((revision) => ({
    ...revision,
    authorName: revision.createdBy ? authorNames.get(revision.createdBy) ?? null : null,
  }));
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeAdminRequest(_request, "content.edit");
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const decodedId = decodeURIComponent(id);
  const supabase = createSupabaseAdminClient();
  const revisions = await listCmsRevisions(supabase, decodedId);
  const revisionsWithAuthors = await enrichRevisionAuthors(revisions, supabase);

  return NextResponse.json({ revisions: revisionsWithAuthors });
}
