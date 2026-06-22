import Link from "next/link";
import Image from "next/image";
import { BookOpen } from "lucide-react";
import { BLOG_EDITORIAL } from "@/data/blog-author";
import { cn } from "@/lib/cn";
import { cabinetCardClass, cabinetLinkClass } from "@/lib/cabinet-ui";
import { mediaUrl } from "@/lib/media-resolver";
import type { BlogAuthorProfile } from "@/lib/blog-authors";

type BlogAuthorsGridProps = {
  authors: BlogAuthorProfile[];
  className?: string;
};

export default function BlogAuthorsGrid({ authors, className }: BlogAuthorsGridProps) {
  return (
    <ul className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {authors.map((author) => (
        <li key={author.slug}>
          <article className={cn(cabinetCardClass, "flex h-full flex-col p-5")}>
            <div className="flex items-start gap-3">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-sky/10">
                {author.avatar ? (
                  <Image
                    src={mediaUrl(author.avatar)}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-sky">
                    <BookOpen className="h-6 w-6" aria-hidden />
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <h2 className="font-heading text-lg font-bold text-charcoal">{author.name}</h2>
                <p className="mt-1 text-xs text-slate">
                  {author.postCount}{" "}
                  {author.postCount === 1 ? "материал" : author.postCount < 5 ? "материала" : "материалов"}
                </p>
              </div>
            </div>
            {author.bio ? (
              <p className="mt-3 flex-1 text-sm leading-relaxed text-slate">{author.bio}</p>
            ) : null}
            <Link href={`/blog/authors/${author.slug}`} className={cn(cabinetLinkClass, "mt-4 inline-flex text-sm")}>
              Все материалы автора
            </Link>
          </article>
        </li>
      ))}
    </ul>
  );
}

export function BlogEditorialLeadCard({ className }: { className?: string }) {
  return (
    <article
      className={cn(
        cabinetCardClass,
        "mb-8 flex flex-col gap-4 border-sky/15 bg-gradient-to-br from-sky/[0.06] to-white p-6 sm:flex-row sm:items-center",
        className,
      )}
    >
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl">
        <Image src={mediaUrl(BLOG_EDITORIAL.avatar)} alt="" fill className="object-cover" sizes="80px" />
      </div>
      <div>
        <h2 className="font-heading text-xl font-bold text-charcoal">{BLOG_EDITORIAL.name}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate">{BLOG_EDITORIAL.bio}</p>
        <Link href="/blog/authors/redaktsiya" className={cn(cabinetLinkClass, "mt-3 inline-flex text-sm")}>
          Архив редакции
        </Link>
      </div>
    </article>
  );
}
