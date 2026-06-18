import {
  SITE_EMAIL,
  SITE_OFFICE,
  SITE_PHONES,
  SITE_WORKING_HOURS,
} from "@/data/site-contacts";
import { absoluteUrl, getSiteUrl } from "@/lib/site-url";

export default function ContactPageJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Контакты — Пора в Аргентину",
    url: absoluteUrl("/contacts"),
    description:
      "Свяжитесь с редакцией и менеджерами: форма обратной связи, WhatsApp, email и офис в Буэнос-Айресе.",
    mainEntity: {
      "@type": "Organization",
      name: "Пора в Аргентину",
      url: getSiteUrl(),
      email: SITE_EMAIL.display,
      contactPoint: SITE_PHONES.map((phone) => ({
        "@type": "ContactPoint",
        telephone: phone.tel,
        contactType: "customer service",
        availableLanguage: ["Russian", "Spanish"],
        areaServed: ["AR", "RU"],
      })),
      address: {
        "@type": "PostalAddress",
        addressLocality: "Buenos Aires",
        addressCountry: "AR",
        name: SITE_OFFICE.display,
      },
      hoursAvailable: {
        "@type": "OpeningHoursSpecification",
        description: SITE_WORKING_HOURS,
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
