import Link from "next/link";
import { SafeImage } from "@/components/ui/safe-image";
import { BLOG_EDITORIAL } from "@/data/blog-author";
import { cn } from "@/lib/cn";
import type { BlogPost } from "@/types";

type BlogAuthorCardProps = {
  post: BlogPost;
  className?: string;
};

export default function BlogAuthorCard({ post, className }: BlogAuthorCardProps) {
  const avatar = post.authorAvatar ?? BLOG_EDITORIAL.avatar;
  const bio = post.authorBio ?? BLOG_EDITORIAL.bio;
  const initial = post.author.trim().charAt(0).toUpperCase() || "Р";
  const isEditorial = post.author === BLOG_EDITORIAL.name || post.author.includes("Редакция");

  return (
    <aside
      className={cn(
        "flex gap-4 rounded-2xl border border-gray-100 bg-gradient-to-br from-sky/[0.04] to-white p-4 sm:p-5",
        className,
      )}
      aria-label="Об авторе"
    >
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full ring-2 ring-sky/15 sm:h-16 sm:w-16">
        {avatar ? (
          <SafeImage
            src={avatar}
            alt=""
            fill
            className="object-cover"
            sizes="64px"
            placeholderVariant="avatar"
            placeholderCompact
            blurPlaceholder={false}
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-sky/10 text-lg font-bold text-sky">
            {initial}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate">Автор</p>
        <p className="mt-1 font-heading text-base font-bold text-charcoal sm:text-lg">{post.author}</p>
        <p className="mt-1.5 text-sm leading-relaxed text-slate">{bio}</p>
        {isEditorial ? (
          <p className="mt-2 text-xs text-slate">
            Вопросы по материалу —{" "}
            <Link href="/contacts" className="font-medium text-sky hover:underline">
              связаться с редакцией
            </Link>
          </p>
        ) : null}
      </div>
    </aside>
  );
}
