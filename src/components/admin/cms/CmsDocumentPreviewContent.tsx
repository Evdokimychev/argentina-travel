"use client";

import LegalPageView from "@/components/legal/LegalPageView";
import ContentPageView from "@/components/content/ContentPageView";
import BlogPostView from "@/components/blog/BlogPostView";
import DestinationDetailView from "@/components/destinations/DestinationDetailView";
import PlaceDetailView from "@/components/places/PlaceDetailView";
import {
  blogPostFromCms,
  destinationPageFromCms,
  guidePageFromCms,
  legalDocumentFromCms,
  placeDetailFromCms,
  type CmsDocument,
} from "@/types/cms-content";

type Props = {
  doc: CmsDocument;
};

export default function CmsDocumentPreviewContent({ doc }: Props) {
  if (doc.body.kind === "legal") {
    const legal = legalDocumentFromCms(doc);
    return legal ? <LegalPageView document={legal} /> : null;
  }

  if (doc.body.kind === "blog") {
    const post = blogPostFromCms(doc);
    return post ? <BlogPostView post={post} initialTours={[]} /> : null;
  }

  if (doc.body.kind === "guide") {
    const page = guidePageFromCms(doc);
    return page ? <ContentPageView page={page} /> : null;
  }

  if (doc.body.kind === "destination") {
    const destination = destinationPageFromCms(doc);
    return destination ? (
      <DestinationDetailView destination={destination} initialTours={[]} />
    ) : null;
  }

  if (doc.body.kind === "place") {
    const place = placeDetailFromCms(doc);
    return place ? <PlaceDetailView place={place} initialTours={[]} /> : null;
  }

  return (
    <p className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-slate">
      Тип документа не поддерживается для предпросмотра.
    </p>
  );
}
