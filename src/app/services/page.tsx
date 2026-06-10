import ServicesPageView from "@/components/services/ServicesPageView";
import WebPageJsonLd from "@/components/seo/WebPageJsonLd";
import { buildPublicPageMetadata } from "@/lib/page-metadata";

const PAGE_TITLE = "Сервисы для поездки — Пора в Аргентину";
const PAGE_DESCRIPTION =
  "Перелёты, трансферы, страхование и визовая поддержка — партнёрские ссылки и заявки через платформу.";

export const metadata = buildPublicPageMetadata({
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  path: "/services",
});

export default function ServicesPage() {
  return (
    <>
      <WebPageJsonLd name={PAGE_TITLE} description={PAGE_DESCRIPTION} path="/services" />
      <ServicesPageView />
    </>
  );
}
