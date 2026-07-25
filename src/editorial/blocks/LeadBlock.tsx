import { cn } from "@/lib/cn";
import type { BlogEditorialDensity } from "@/types/blog-content-blocks";

type Props = {
  text: string;
  variant?: "default" | "wide" | "compact" | "with-icon" | "with-author-note";
  density?: BlogEditorialDensity;
};

export default function LeadBlock({ text, variant = "default", density = "comfortable" }: Props) {
  if (!text.trim()) return null;

  return (
    <p
      className={cn(
        "font-heading text-charcoal",
        density === "compact" && "text-base leading-relaxed",
        density === "comfortable" && "text-lg leading-relaxed sm:text-xl",
        density === "spacious" && "text-xl leading-relaxed sm:text-2xl",
        variant === "wide" && "max-w-3xl",
        variant === "compact" && "text-base sm:text-lg",
        variant === "with-author-note" && "border-l-2 border-sky/40 pl-4",
        variant === "default" && "max-w-2xl",
      )}
      data-editorial-block="lead"
      data-variant={variant}
    >
      {text}
    </p>
  );
}
