"use client";

import LegalPageView from "@/components/legal/LegalPageView";
import ContentPageView from "@/components/content/ContentPageView";
import BlogPostView from "@/components/blog/BlogPostView";
import DestinationDetailView from "@/components/destinations/DestinationDetailView";
import PlaceDetailView from "@/components/places/PlaceDetailView";
import CmsContentSections from "@/components/content/CmsContentSections";
import {
  blogPostFromCms,
  authorArticleFromCms,
  destinationPageFromCms,
  guidePageFromCms,
  landingPageFromCms,
  legalDocumentFromCms,
  placeDetailFromCms,
  type CmsDocument,
} from "@/types/cms-content";
import { blocksToPlainText } from "@/lib/cms/page-builder/block-normalize";
import { renderMarkdown } from "@/lib/knowledge-base/markdown";

type Props = {
  doc: CmsDocument;
};

export default function CmsDocumentPreviewContent({ doc }: Props) {
  if (doc.body.kind === "legal") {
    const legal = legalDocumentFromCms(doc);
    return legal ? <LegalPageView document={legal} /> : null;
  }

  if (doc.docType === "knowledge" && doc.body.kind === "blog") {
    const body =
      doc.body.content?.trim() ||
      doc.body.sections
        ?.map((section) => {
          const prose = section.body?.trim() ?? "";
          const fromBlocks = section.blocks?.length ? blocksToPlainText(section.blocks) : "";
          const combined = [prose, fromBlocks].filter(Boolean).join("\n\n");
          return combined ? `## ${section.title}\n\n${combined}` : `## ${section.title}`;
        })
        .join("\n\n") ||
      "";
    return (
      <article className="mx-auto max-w-3xl px-5 py-10 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-sky-ink">
          База знаний · предпросмотр
        </p>
        <h1 className="mt-3 font-heading text-3xl font-bold text-foreground">{doc.title}</h1>
        {doc.body.excerpt ? (
          <p className="mt-4 text-lg leading-7 text-slate">{doc.body.excerpt}</p>
        ) : null}
        <div className="mt-8 text-base">
          {renderMarkdown(body, { validIds: new Set([doc.slug]) })}
        </div>
        {doc.body.sections?.some((section) => (section.blocks?.length ?? 0) > 0) ? (
          <div className="mt-10 space-y-6 border-t border-border-subtle pt-8">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate">
              Блоки конструктора
            </p>
            <CmsContentSections
              sections={doc.body.sections.map((section) => ({
                heading: section.title,
                blocks: section.blocks,
                paragraphs: section.body ? [section.body] : undefined,
              }))}
            />
          </div>
        ) : null}
      </article>
    );
  }

  if (doc.body.kind === "blog") {
    const post = blogPostFromCms(doc);
    return post ? <BlogPostView post={post} initialTours={[]} /> : null;
  }

  if (doc.body.kind === "author_article") {
    const post = authorArticleFromCms(doc);
    return post ? <BlogPostView post={post} initialTours={[]} /> : null;
  }

  if (doc.body.kind === "guide") {
    const page = guidePageFromCms(doc);
    return page ? <ContentPageView page={page} /> : null;
  }

  if (doc.body.kind === "landing") {
    const page = landingPageFromCms(doc);
    return page ? <ContentPageView page={page} /> : null;
  }

  if (doc.body.kind === "destination") {
    const destination = destinationPageFromCms(doc);
    return destination ? (
      <DestinationDetailView
        destination={destination}
        initialTours={[]}
        cmsSections={<CmsContentSections sections={destination.sections} />}
      />
    ) : null;
  }

  if (doc.body.kind === "place") {
    const place = placeDetailFromCms(doc);
    return place ? (
      <PlaceDetailView
        place={place}
        initialTours={[]}
        cmsSections={<CmsContentSections sections={place.sections} />}
      />
    ) : null;
  }

  return (
    <p className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-slate">
      Тип документа не поддерживается для предпросмотра.
    </p>
  );
}
