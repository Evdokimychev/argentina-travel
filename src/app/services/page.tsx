import FlightPriceTeaserGrid from "@/components/flights/FlightPriceTeaserGrid";
import ServicesPageView from "@/components/services/ServicesPageView";
import WebPageJsonLd from "@/components/seo/WebPageJsonLd";
import { getServiceCategoriesForModules } from "@/data/services-hub";
import { buildPublicPageMetadata } from "@/lib/page-metadata";
import { fetchSiteControlPlaneEdge } from "@/lib/site-settings-edge";

const PAGE_TITLE = "Сервисы для поездки";
const PAGE_DESCRIPTION =
  "Перелёты, трансферы, страхование и визовая поддержка — партнёрские ссылки и заявки через платформу.";

export const metadata = buildPublicPageMetadata({
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  path: "/services",
});

export default async function ServicesPage() {
  const controlPlane = await fetchSiteControlPlaneEdge();
  const categories = getServiceCategoriesForModules(controlPlane.modules);

  return (
    <>
      <WebPageJsonLd name={PAGE_TITLE} description={PAGE_DESCRIPTION} path="/services" />
      <ServicesPageView
        categories={categories}
        flightsTeaser={<FlightPriceTeaserGrid title="Примеры цен на популярные маршруты" />}
      />
    </>
  );
}
