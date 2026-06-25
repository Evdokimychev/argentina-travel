import type { Metadata } from "next";
import { fetchSitePublicMeta } from "@/lib/site-settings-server";
import { absoluteUrl } from "@/lib/site-url";
import {
  resolveYandexDistributionVerifyCode,
  YANDEX_DISTRIBUTION_VERIFY_PATH,
} from "@/lib/yandex-distribution-verify";

export async function generateMetadata(): Promise<Metadata> {
  const { seo } = await fetchSitePublicMeta();
  const code = resolveYandexDistributionVerifyCode(seo);

  return {
    title: "Yandex verification",
    robots: { index: false, follow: false },
    verification: { yandex: code },
  };
}

export default async function YandexVerificationPage() {
  const { seo } = await fetchSitePublicMeta();
  const code = resolveYandexDistributionVerifyCode(seo);

  return (
    <main className="mx-auto max-w-lg px-4 py-16">
      <p className="text-sm text-muted-foreground">
        Страница верификации для Яндекс Дистрибуции ({absoluteUrl(YANDEX_DISTRIBUTION_VERIFY_PATH)}).
      </p>
      {/* Yandex Distribution crawls plain text in HTML source */}
      <p className="mt-4 font-mono text-base">{code}</p>
    </main>
  );
}
