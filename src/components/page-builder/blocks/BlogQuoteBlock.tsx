import { Quote } from "lucide-react";

type Props = {
  text: string;
  author?: string;
  context?: string;
};

export default function BlogQuoteBlock({ text, author, context }: Props) {
  if (!text.trim()) return null;

  return (
    <figure className="relative overflow-hidden rounded-[1.75rem] border border-sky/15 bg-gradient-to-br from-sky/[0.09] via-white to-surface-muted px-5 py-7 sm:px-8 sm:py-9">
      <Quote className="absolute right-5 top-4 h-16 w-16 text-sky/10 sm:right-8" aria-hidden />
      <blockquote className="relative max-w-3xl font-display text-xl font-medium leading-relaxed tracking-[-0.015em] text-charcoal sm:text-2xl">
        «{text}»
      </blockquote>
      {author || context ? (
        <figcaption className="relative mt-5 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm">
          {author ? <span className="font-semibold text-charcoal">{author}</span> : null}
          {context ? <span className="text-slate">{context}</span> : null}
        </figcaption>
      ) : null}
    </figure>
  );
}
