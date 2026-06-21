import Link from "next/link";
import { cn } from "@/lib/cn";
import { buttonVariants } from "@/components/ui/button";
import type { BlogCtaVariant } from "@/types/blog-content-blocks";

type Props = {
  label: string;
  href: string;
  variant?: BlogCtaVariant;
};

export default function BlogCtaBlock({ label, href, variant = "primary" }: Props) {
  if (!label.trim() || !href.trim()) return null;

  const isExternal = href.startsWith("http");

  return (
    <div className="flex flex-wrap gap-3">
      <Link
        href={href}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        className={cn(
          buttonVariants({
            size: "lg",
            variant: variant === "primary" ? "default" : variant === "secondary" ? "secondary" : "outline",
          })
        )}
      >
        {label}
      </Link>
    </div>
  );
}
