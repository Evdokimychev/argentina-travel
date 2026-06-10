import Image from "next/image";
import Link from "next/link";
import { BlogPost } from "@/types";
import { formatDate } from "@/data/blog";

interface BlogCardProps {
  post: BlogPost;
}

export default function BlogCard({ post }: BlogCardProps) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group card-hover block overflow-hidden rounded-2xl bg-white shadow-card"
    >
      <div className="relative h-48 overflow-hidden">
        <Image
          src={post.image}
          alt={post.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <span className="absolute left-4 top-4 rounded-full bg-wine px-3 py-1 text-xs font-semibold text-white">
          {post.category}
        </span>
      </div>
      <div className="p-5">
        <div className="flex items-center gap-2 text-xs text-slate">
          <span>{formatDate(post.date)}</span>
          <span>•</span>
          <span>{post.readTime}</span>
        </div>
        <h3 className="mt-2 font-display text-lg font-bold text-charcoal group-hover:text-sky transition-colors">
          {post.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm text-slate">{post.excerpt}</p>
      </div>
    </Link>
  );
}
