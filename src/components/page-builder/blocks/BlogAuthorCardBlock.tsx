import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";

type Props = {
  name: string;
  role?: string;
  bio: string;
  avatarSrc?: string;
  avatarAlt?: string;
  href?: string;
  linkLabel?: string;
};

export default function BlogAuthorCardBlock({
  name,
  role,
  bio,
  avatarSrc,
  avatarAlt,
  href,
  linkLabel,
}: Props) {
  if (!name.trim() && !bio.trim()) return null;

  const isExternal = href?.startsWith("http");

  return (
    <aside className="relative overflow-hidden rounded-[1.75rem] border border-sky/15 bg-gradient-to-br from-white via-surface-elevated to-sky/5 p-5 shadow-sm sm:p-7">
      <div className="absolute -right-12 -top-16 h-40 w-40 rounded-full bg-sky/10 blur-3xl" aria-hidden />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-surface-muted ring-4 ring-white shadow-sm sm:h-28 sm:w-28">
          <SafeImage
            src={avatarSrc ?? ""}
            alt={avatarAlt || (name ? `Портрет: ${name}` : "Портрет автора")}
            fill
            className="object-cover"
            sizes="112px"
            placeholderVariant="avatar"
            placeholderCompact
            preferLocalMedia
          />
        </div>

        <div className="min-w-0 flex-1">
          {role ? (
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-dark">
              {role}
            </p>
          ) : null}
          <p className="mt-1 font-display text-2xl font-semibold tracking-[-0.02em] text-charcoal">
            {name || "Автор материала"}
          </p>
          {bio ? <p className="mt-2 text-sm leading-6 text-slate">{bio}</p> : null}
          {href ? (
            <Link
              href={href}
              target={isExternal ? "_blank" : undefined}
              rel={isExternal ? "noopener noreferrer" : undefined}
              className="mt-4 inline-flex items-center gap-1.5 rounded-full text-sm font-semibold text-sky-dark transition hover:text-sky focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40 focus-visible:ring-offset-2"
            >
              {linkLabel?.trim() || "Об авторе"}
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
