"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import TourDetailView from "@/components/tour-detail/TourDetailView";
import { readOrganizerTourDraft } from "@/lib/organizer-tour-store";
import { buildTourDetailFromOrganizerDraft } from "@/lib/tour-repository";
import {
  clearStagedOrganizerTourPreviewDraft,
  readStagedOrganizerTourPreviewDraft,
} from "@/lib/tour-preview";
import { getCatalogSlug } from "@/lib/tour-slug";
import type { OrganizerTourDraft } from "@/types/organizer-tour";

interface OrganizerTourPreviewViewProps {
  tourId: string;
}

export default function OrganizerTourPreviewView({ tourId }: OrganizerTourPreviewViewProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [draft, setDraft] = useState<OrganizerTourDraft | null>(null);

  useEffect(() => {
    if (!user) return;

    const staged = readStagedOrganizerTourPreviewDraft(tourId);
    const saved = readOrganizerTourDraft(tourId, user);
    const nextDraft = staged ?? saved;

    if (!nextDraft) {
      router.replace("/organizer/tours");
      return;
    }

    setDraft(nextDraft);
    clearStagedOrganizerTourPreviewDraft(tourId);
  }, [router, tourId, user]);

  const preview = useMemo(() => {
    if (!draft) return null;
    return buildTourDetailFromOrganizerDraft(draft);
  }, [draft]);

  if (!user || !draft || !preview) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <p className="text-sm text-slate">Загружаем предпросмотр тура…</p>
      </div>
    );
  }

  const slug = getCatalogSlug(draft);

  return (
    <TourDetailView
      slug={slug}
      tour={preview.tour}
      similarTours={[]}
      previewMode
      previewCanonicalTour={preview.canonical}
      previewEditHref={`/organizer/tours/${tourId}/edit`}
      previewIsPublished={draft.status === "published" && !draft.archived}
    />
  );
}
