import Link from "next/link";
import { ArrowRight } from "lucide-react";
import HubSection from "@/components/guide/hub/HubSection";

export type GuideRelatedArticle = {
  title: string;
  href: string;
  description?: string;
};

type GuideRelatedArticlesGridProps = {
  articles: GuideRelatedArticle[];
};

export default function GuideRelatedArticlesGrid({ articles }: GuideRelatedArticlesGridProps) {
  if (!articles.length) return null;

  return (
    <HubSection id="read-more" title="Читайте также">
      <div className="grid gap-3 sm:grid-cols-2">
        {articles.map((article) => (
          <Link
            key={article.href + article.title}
            href={article.href}
            className="group flex items-start justify-between gap-3 rounded-2xl border border-gray-100 p-4 transition-colors hover:border-sky/30 hover:bg-sky/5"
          >
            <span className="min-w-0">
              <span className="block font-medium text-charcoal group-hover:text-sky">
                {article.title}
              </span>
              {article.description ? (
                <span className="mt-0.5 block text-xs text-slate">{article.description}</span>
              ) : null}
            </span>
            <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-slate group-hover:text-sky" aria-hidden />
          </Link>
        ))}
      </div>
    </HubSection>
  );
}
