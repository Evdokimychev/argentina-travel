import type { FlightPriceTeaser } from "@/lib/flights/hub-price-teasers";

import { absoluteUrl } from "@/lib/site-url";

const SITE_ORIGIN = absoluteUrl("");

type FlightOffersJsonLdProps = {
  teasers: FlightPriceTeaser[];
  pageUrl: string;
};

export default function FlightOffersJsonLd({ teasers, pageUrl }: FlightOffersJsonLdProps) {
  if (teasers.length === 0) return null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Flight price hints",
    itemListElement: teasers.map((teaser, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Offer",
        name: `${teaser.originLabel} → ${teaser.destinationLabel}`,
        price: Math.round(teaser.price),
        priceCurrency: teaser.currency,
        url: `${SITE_ORIGIN}${pageUrl}`,
        availability: "https://schema.org/InStock",
        seller: {
          "@type": "Organization",
          name: "Aviasales",
        },
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
