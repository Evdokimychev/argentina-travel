"use client";

import { useEffect, useState } from "react";
import {
  BLOG_HERO_COPY,
  BLOG_HERO_VARIANT_KEY,
  pickBlogHeroVariant,
  resolveBlogHeroVariant,
  type BlogHeroVariant,
} from "@/lib/blog-hero-variant";

type BlogHeroVariantCopyProps = {
  children: (variant: BlogHeroVariant, copy: (typeof BLOG_HERO_COPY)[BlogHeroVariant]) => React.ReactNode;
};

export default function BlogHeroVariantCopy({ children }: BlogHeroVariantCopyProps) {
  const [variant, setVariant] = useState<BlogHeroVariant>("a");

  useEffect(() => {
    const stored = window.localStorage.getItem(BLOG_HERO_VARIANT_KEY);
    setVariant(stored ? resolveBlogHeroVariant(stored) : pickBlogHeroVariant());
  }, []);

  return <>{children(variant, BLOG_HERO_COPY[variant])}</>;
}
