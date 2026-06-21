import type { BlogVideoProvider } from "@/types/blog-content-blocks";

type Props = {
  provider: BlogVideoProvider;
  videoId: string;
  title?: string;
  caption?: string;
};

function embedSrc(provider: BlogVideoProvider, videoId: string): string {
  if (provider === "vimeo") {
    return `https://player.vimeo.com/video/${encodeURIComponent(videoId)}`;
  }
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}`;
}

export default function BlogVideoBlock({ provider, videoId, title, caption }: Props) {
  if (!videoId.trim()) return null;

  return (
    <figure className="overflow-hidden rounded-2xl border border-gray-100 bg-black shadow-sm">
      <div className="relative aspect-video">
        <iframe
          src={embedSrc(provider, videoId)}
          title={title || "Видео"}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>
      {caption ? <figcaption className="bg-white px-4 py-2 text-sm text-slate">{caption}</figcaption> : null}
    </figure>
  );
}
