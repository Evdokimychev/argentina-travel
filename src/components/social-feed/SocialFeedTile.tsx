"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ExternalLink, Camera, Play } from "lucide-react";
import { cn } from "@/lib/cn";
import type { SocialFeedItem, SocialFeedSource } from "@/lib/social-feed/types";

type SocialFeedTileProps = {
  item: SocialFeedItem;
  source?: SocialFeedSource;
  className?: string;
  sizes?: string;
  priority?: boolean;
  onClick?: () => void;
};

export function SocialFeedTile({
  item,
  source,
  className,
  sizes = "(max-width: 768px) 45vw, 280px",
  priority = false,
  onClick,
}: SocialFeedTileProps) {
  const reduceMotion = useReducedMotion();
  const href = item.permalink;
  const isExternal = href?.startsWith("http");

  const inner = (
    <>
      <Image
        src={item.thumbnailUrl}
        alt={item.caption?.slice(0, 120) ?? "Фото из Instagram"}
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transform-none"
        sizes={sizes}
        priority={priority}
        loading={priority ? undefined : "lazy"}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-charcoal/55 via-transparent to-transparent opacity-80 transition-opacity group-hover:opacity-100" />

      {item.mediaType === "video" ? (
        <span className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-charcoal shadow-sm">
          <Play className="ml-0.5 h-4 w-4 fill-current" aria-hidden />
        </span>
      ) : null}

      <div className="absolute inset-x-0 bottom-0 p-3 text-left">
        {item.caption ? (
          <p className="line-clamp-2 text-xs font-medium leading-snug text-white drop-shadow-sm">
            {item.caption}
          </p>
        ) : null}
        <p className="mt-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-white/75">
          {source?.type === "instagram" ? <Camera className="h-3 w-3" aria-hidden /> : null}
          @{item.authorHandle ?? source?.handle ?? "instagram"}
          {isExternal ? <ExternalLink className="h-3 w-3 opacity-70" aria-hidden /> : null}
        </p>
      </div>
    </>
  );

  const tileClass =
    "relative block aspect-[4/5] w-full overflow-hidden rounded-2xl bg-charcoal/5 ring-1 ring-charcoal/[0.06] transition-shadow hover:shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40";

  return (
    <motion.div
      layout={!reduceMotion}
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={cn("group relative", className)}
    >
      {href && isExternal ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={tileClass}
          aria-label={item.caption?.slice(0, 80) ?? "Открыть публикацию"}
        >
          {inner}
        </a>
      ) : href ? (
        <Link
          href={href}
          className={tileClass}
          aria-label={item.caption?.slice(0, 80) ?? "Открыть публикацию"}
        >
          {inner}
        </Link>
      ) : (
        <button
          type="button"
          onClick={onClick}
          className={tileClass}
          aria-label={item.caption?.slice(0, 80) ?? "Открыть публикацию"}
        >
          {inner}
        </button>
      )}
    </motion.div>
  );
}
