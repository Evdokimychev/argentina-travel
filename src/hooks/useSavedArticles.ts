"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getSavedArticlesStore,
  SAVED_ARTICLES_UPDATED_EVENT,
  type SavedArticleRecord,
} from "@/lib/saved-articles-store";
import { syncSavedArticlesWithRemote, syncSavedArticleToggle } from "@/lib/saved-articles-sync";
import type { BlogPost } from "@/types";

export function useSavedArticles() {
  const { user } = useAuth();
  const store = getSavedArticlesStore();
  const [saved, setSaved] = useState<SavedArticleRecord[]>(() =>
    typeof window === "undefined" ? [] : store.list(),
  );

  const refresh = useCallback(() => {
    setSaved(store.list());
  }, [store]);

  useEffect(() => {
    refresh();
    window.addEventListener(SAVED_ARTICLES_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(SAVED_ARTICLES_UPDATED_EVENT, refresh);
  }, [refresh]);

  useEffect(() => {
    if (!user) return;
    void syncSavedArticlesWithRemote().then(refresh);
  }, [user, refresh]);

  const isSaved = useCallback((slug: string) => store.isSaved(slug), [store]);

  const toggle = useCallback(
    (
      post: Pick<BlogPost, "slug" | "title"> & Partial<Pick<BlogPost, "category" | "image">>,
    ) => {
      const next = store.toggle(post);
      refresh();
      void syncSavedArticleToggle(
        {
          slug: post.slug,
          title: post.title,
          category: post.category,
          image: post.image,
          savedAt: new Date().toISOString(),
        },
        next,
      );
      return next;
    },
    [store, refresh],
  );

  return { saved, isSaved, toggle, refresh };
}
