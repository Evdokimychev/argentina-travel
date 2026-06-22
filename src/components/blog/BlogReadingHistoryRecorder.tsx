"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { recordBlogReading } from "@/lib/blog-reading-history";
import {
  syncBlogReadingHistoryEntry,
  syncBlogReadingHistoryWithRemote,
} from "@/lib/blog-reading-history-sync";
import { trackBlogArticleView } from "@/lib/analytics/gtm-events";
import type { BlogPost } from "@/types";

type BlogReadingHistoryRecorderProps = {
  post: Pick<BlogPost, "slug" | "title" | "category">;
};

export default function BlogReadingHistoryRecorder({ post }: BlogReadingHistoryRecorderProps) {
  const { user } = useAuth();

  useEffect(() => {
    recordBlogReading(post);
    trackBlogArticleView({
      slug: post.slug,
      title: post.title,
      category: post.category,
    });

    const entry = {
      slug: post.slug,
      title: post.title,
      category: post.category,
      readAt: new Date().toISOString(),
    };
    void syncBlogReadingHistoryEntry(entry);
  }, [post.slug, post.title, post.category]);

  useEffect(() => {
    if (!user) return;
    void syncBlogReadingHistoryWithRemote();
  }, [user]);

  return null;
}
