import Link from "next/link";
import { Lock, MessageSquare, MessagesSquare } from "lucide-react";
import type { ForumCategory } from "@/lib/forum/forum-types";
import { siteContainerClass } from "@/lib/site-container";
import { cn } from "@/lib/cn";

export default function ForumIndexView({ categories }: { categories: ForumCategory[] }) {
  return (
    <div className="bg-surface-muted pb-16">
      <div className={cn(siteContainerClass, "py-8 md:py-12")}>
        <div className="mx-auto max-w-3xl">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky/10 text-sky">
              <MessagesSquare className="h-6 w-6" strokeWidth={1.75} />
            </span>
            <div>
              <h1 className="font-display text-3xl font-bold text-charcoal md:text-4xl">Форум</h1>
              <p className="mt-2 text-slate">
                Обсуждения о жизни, переезде и путешествиях по Аргентине. Открытые разделы доступны
                без регистрации; чтобы писать — войдите в аккаунт.
              </p>
            </div>
          </div>

          <ul className="mt-10 space-y-4">
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/forum/${category.slug}`}
                  className="block rounded-2xl border border-border-subtle bg-surface-elevated p-5 shadow-sm transition-colors hover:border-sky/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-heading text-lg font-bold text-charcoal">{category.title}</h2>
                      {category.description ? (
                        <p className="mt-1 text-sm leading-relaxed text-slate">{category.description}</p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-2 text-xs text-slate">
                      {!category.publicRead ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5">
                          <Lock className="h-3 w-3" />
                          Для участников
                        </span>
                      ) : null}
                      <span className="inline-flex items-center gap-1">
                        <MessageSquare className="h-3.5 w-3.5" />
                        {category.threadCount ?? 0}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
