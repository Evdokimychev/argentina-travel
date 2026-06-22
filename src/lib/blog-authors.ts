import { BLOG_EDITORIAL } from "@/data/blog-author";
import type { BlogPost } from "@/types";

export type BlogAuthorProfile = {
  slug: string;
  name: string;
  bio?: string;
  avatar?: string;
  postCount: number;
};

function authorSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function buildBlogAuthorProfiles(posts: BlogPost[]): BlogAuthorProfile[] {
  const byName = new Map<string, BlogPost[]>();

  for (const post of posts) {
    if (post.noIndex) continue;
    const list = byName.get(post.author) ?? [];
    list.push(post);
    byName.set(post.author, list);
  }

  const profiles: BlogAuthorProfile[] = [];

  for (const [name, authorPosts] of byName) {
    const sample = authorPosts[0];
    const isEditorial = name === BLOG_EDITORIAL.name;
    profiles.push({
      slug: isEditorial ? "redaktsiya" : authorSlug(name),
      name,
      bio: isEditorial ? BLOG_EDITORIAL.bio : sample.authorBio,
      avatar: isEditorial ? BLOG_EDITORIAL.avatar : sample.authorAvatar,
      postCount: authorPosts.length,
    });
  }

  return profiles.sort((a, b) => b.postCount - a.postCount || a.name.localeCompare(b.name, "ru"));
}

export function getBlogAuthorProfile(
  slug: string,
  posts: BlogPost[],
): BlogAuthorProfile | undefined {
  return buildBlogAuthorProfiles(posts).find((profile) => profile.slug === slug);
}

export function getBlogPostsByAuthorSlug(slug: string, posts: BlogPost[]): BlogPost[] {
  const profile = getBlogAuthorProfile(slug, posts);
  if (!profile) return [];
  return posts
    .filter((post) => !post.noIndex && post.author === profile.name)
    .sort((a, b) => b.date.localeCompare(a.date));
}
