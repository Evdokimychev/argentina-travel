import { Suspense } from "react";
import InsuranceView from "@/components/insurance/InsuranceView";
import WebPageJsonLd from "@/components/seo/WebPageJsonLd";
import { buildPublicPageMetadata } from "@/lib/page-metadata";
import { getInsuranceWhitelabelScriptUrl } from "@/lib/travelpayouts/whitelabel/insurance-config";

const PAGE_TITLE = "Туристическая страховка в Аргентину";
const PAGE_DESCRIPTION =
  "Медицинская страховка для поездки в Аргентину: подбор полиса онлайн через партнёра Travelpayouts. Покрытие медицины, эвакуации и активного отдыха.";

export const metadata = buildPublicPageMetadata({
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  path: "/insurance",
});

export default function InsurancePage() {
  const scriptUrl = getInsuranceWhitelabelScriptUrl();

  return (
    <>
      <WebPageJsonLd name={PAGE_TITLE} description={PAGE_DESCRIPTION} path="/insurance" />
      <Suspense fallback={null}>
        <InsuranceView scriptUrl={scriptUrl} />
      </Suspense>
    </>
  );
}
