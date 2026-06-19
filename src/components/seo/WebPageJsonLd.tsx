import { absoluteUrl } from "@/lib/site-url";

type WebPageJsonLdProps = {
  name: string;
  description: string;
  path: string;
};

export default function WebPageJsonLd({ name, description, path }: WebPageJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name,
    description,
    url: absoluteUrl(path),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
