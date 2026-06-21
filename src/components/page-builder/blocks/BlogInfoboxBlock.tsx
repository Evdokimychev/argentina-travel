import BlogCallout from "@/components/blog/BlogCallout";
import type { BlogCalloutVariant, BlogInfoboxVariant } from "@/types/blog-content-blocks";

const INFOBOX_TO_CALLOUT: Record<BlogInfoboxVariant, BlogCalloutVariant> = {
  important: "important",
  tip: "tip",
  warning: "warning",
};

const INFOBOX_TITLES: Record<BlogInfoboxVariant, string> = {
  important: "Важно",
  tip: "Совет",
  warning: "Предупреждение",
};

type Props = {
  variant: BlogInfoboxVariant;
  title: string;
  body: string;
};

export default function BlogInfoboxBlock({ variant, title, body }: Props) {
  return (
    <BlogCallout
      variant={INFOBOX_TO_CALLOUT[variant]}
      title={title.trim() || INFOBOX_TITLES[variant]}
      body={body}
    />
  );
}
