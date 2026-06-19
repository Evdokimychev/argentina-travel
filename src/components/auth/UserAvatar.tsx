"use client";

import { SafeImage } from "@/components/ui/safe-image";
import { avatarAlt } from "@/lib/media-alt-text";
import { cn } from "@/lib/cn";

interface UserAvatarProps {
  name: string;
  avatarUrl?: string | null;
  className?: string;
  imageClassName?: string;
}

function InitialsFallback({ name, className }: { name: string; className?: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <span
      className={cn(
        "flex h-full w-full shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand/90 to-brand font-bold text-white",
        className,
      )}
      aria-hidden
    >
      {initial}
    </span>
  );
}

export default function UserAvatar({
  name,
  avatarUrl,
  className,
  imageClassName,
}: UserAvatarProps) {
  const resolvedUrl = avatarUrl?.trim();

  if (!resolvedUrl) {
    return (
      <span
        className={cn("relative block shrink-0 overflow-hidden rounded-full", className)}
        role="img"
        aria-label={avatarAlt(name)}
      >
        <InitialsFallback name={name} className={imageClassName} />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "relative block shrink-0 overflow-hidden rounded-full bg-surface-muted",
        className,
      )}
    >
      <SafeImage
        src={resolvedUrl}
        alt={avatarAlt(name)}
        fill
        placeholderVariant="avatar"
        placeholderCompact
        fallback={<InitialsFallback name={name} className={imageClassName} />}
        className={cn("object-cover", imageClassName)}
        sizes="96px"
      />
    </span>
  );
}
