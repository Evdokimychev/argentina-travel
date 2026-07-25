import Link from "next/link";
import { SafeImage } from "@/components/ui/safe-image";
import { BLOG_EDITORIAL } from "@/data/blog-author";
import { cn } from "@/lib/cn";
import type { BlogPost } from "@/types";

type BlogAuthorCardProps = {
  post: BlogPost;
  className?: string;
};

function authorInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "А";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

export default function BlogAuthorCard({ post, className }: BlogAuthorCardProps) {
  const isEditorial = post.author === BLOG_EDITORIAL.name || post.author.includes("Редакция");
  const avatar = isEditorial ? (post.authorAvatar ?? BLOG_EDITORIAL.avatar) : post.authorAvatar;
  const bio = post.authorBio ?? (isEditorial ? BLOG_EDITORIAL.bio : undefined);
  const role = post.authorRole;
  const authorHref = post.authorUrl;
  const initials = authorInitials(post.author);

  const nameNode = authorHref ? (
    <Link href={authorHref} className="hover:text-sky hover:underline">
      {post.author}
    </Link>
  ) : (
    post.author
  );

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
            {initials}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate">Автор</p>
        <p className="mt-1 font-heading text-base font-bold text-charcoal sm:text-lg">{nameNode}</p>
        {role ? <p className="mt-0.5 text-sm text-slate">{role}</p> : null}
        {bio ? <p className="mt-1.5 text-sm leading-relaxed text-slate">{bio}</p> : null}
        {isEditorial ? (
          <p className="mt-2 text-xs text-slate">
            Вопросы по материалу —{" "}
            <Link href="/contacts" className="font-medium text-sky hover:underline">
              связаться с редакцией
            </Link>
          </p>
        ) : authorHref ? (
          <p className="mt-2 text-xs">
            <Link href={authorHref} className="font-medium text-sky hover:underline">
              Другие материалы автора
            </Link>
          </p>
        ) : null}
      </div>
    </aside>
  );
}
