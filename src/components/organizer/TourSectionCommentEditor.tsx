"use client";

import TourSectionCommentField from "@/components/organizer/TourSectionCommentField";
import type { TourSectionCommentId } from "@/types/tour-section-comments";
import type { TourSectionOrganizerComments } from "@/types/tour-section-comments";

interface TourSectionCommentEditorProps {
  sectionId: TourSectionCommentId;
  value: string;
  onChange: (comments: TourSectionOrganizerComments, legacyPatch?: Partial<{
    itineraryOrganizerCommentText: string;
    accommodationOrganizerCommentText: string;
  }>) => void;
  comments: TourSectionOrganizerComments;
  hint?: string;
}

export default function TourSectionCommentEditor({
  sectionId,
  value,
  onChange,
  comments,
  hint,
}: TourSectionCommentEditorProps) {
  return (
    <TourSectionCommentField
      sectionId={sectionId}
      value={value}
      hint={hint}
      onChange={(next) => {
        const patch: TourSectionOrganizerComments = { ...comments, [sectionId]: next };
        if (sectionId === "itinerary") {
          onChange(patch, { itineraryOrganizerCommentText: next });
          return;
        }
        if (sectionId === "accommodations") {
          onChange(patch, { accommodationOrganizerCommentText: next });
          return;
        }
        onChange(patch);
      }}
    />
  );
}
