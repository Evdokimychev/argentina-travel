import type { Metadata } from "next";

import KbBreadcrumbs from "@/components/knowledge-base/KbBreadcrumbs";
import KbSearch from "@/components/knowledge-base/KbSearch";
import { getSearchIndex } from "@/lib/knowledge-base/content";

export const metadata: Metadata = {
  title: "Поиск по базе знаний об Аргентине",
  description:
    "Быстрый поиск по всем материалам базы знаний «Пора в Аргентину»: путешествия, переезд, документы, деньги, жизнь в стране.",
  alternates: { canonical: "/baza-znaniy/poisk" },
  robots: { index: false, follow: true },
};

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function KnowledgeSearchPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const items = getSearchIndex();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <KbBreadcrumbs
        items={[
          { label: "Главная", href: "/" },
          { label: "База знаний", href: "/baza-znaniy" },
          { label: "Поиск", href: "/baza-znaniy/poisk" },
        ]}
      />
      <h1 className="mt-4 text-2xl font-bold text-foreground sm:text-3xl">
        Поиск по базе знаний
      </h1>
      <p className="mt-2 text-muted">
        {items.length} материалов о путешествиях, переезде, документах и жизни в
        Аргентине.
      </p>
      <div className="mt-6">
        <KbSearch items={items} initialQuery={q ?? ""} />
      </div>
    </div>
  );
}
