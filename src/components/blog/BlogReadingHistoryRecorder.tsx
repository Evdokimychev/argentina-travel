"use client";

import { useEffect } from "react";
import { recordBlogReading } from "@/lib/blog-reading-history";
import { trackBlogArticleView } from "@/lib/analytics/gtm-events";
import type { BlogPost } from "@/types";

type BlogReadingHistoryRecorderProps = {
  post: Pick<BlogPost, "slug" | "title" | "category">;
};

export default function BlogReadingHistoryRecorder({ post }: BlogReadingHistoryRecorderProps) {
  useEffect(() => {
    recordBlogReading(post);
    trackBlogArticleView({
      slug: post.slug,
      title: post.title,
      category: post.category,
    });
  }, [post.slug, post.title, post.category]);

  return null;
}
