import { cn } from "@/lib/cn";

interface UserAvatarProps {
  name: string;
  avatarUrl?: string | null;
  className?: string;
  imageClassName?: string;
}

export default function UserAvatar({
  name,
  avatarUrl,
  className,
  imageClassName,
}: UserAvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  if (avatarUrl) {
    return (
      <span
        className={cn(
          "relative block shrink-0 overflow-hidden rounded-full bg-gray-100",
          className
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarUrl}
          alt={name}
          className={cn("h-full w-full object-cover", imageClassName)}
        />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand/90 to-brand font-bold text-white",
        className
      )}
      aria-hidden
    >
      {initial}
    </span>
  );
}
