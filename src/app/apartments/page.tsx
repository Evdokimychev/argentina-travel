import { notFound } from "next/navigation";
import Link from "next/link";
import { SafeImage } from "@/components/ui/safe-image";
import JsonLdScript from "@/components/seo/JsonLdScript";
import { buildPublicPageMetadata } from "@/lib/page-metadata";
import { listPublishedApartments } from "@/lib/apartments/apartment-repository-server";
import { fetchSiteModules } from "@/lib/site-settings-server";
import { absoluteUrl } from "@/lib/site-url";
import type { JsonLdGraph } from "@/lib/schema-json-ld";
import { PRIMARY_PUBLIC_MARKET } from "@/lib/market-context";

export const dynamic = "force-dynamic";
export const metadata = buildPublicPageMetadata({ title: "Апартаменты в Аргентине", description: "Проверенные апартаменты с понятными условиями. Отправьте запрос — менеджер подтвердит даты и итоговую стоимость.", path: "/apartments" });

function money(minor: number, currency: string) { return new Intl.NumberFormat("ru-RU", { style: "currency", currency, maximumFractionDigits: 0 }).format(minor / 100); }

export default async function ApartmentsPage() {
  const modules = await fetchSiteModules();
  if (modules.apartmentsMode !== "native_request") notFound();
  const apartments = await listPublishedApartments(PRIMARY_PUBLIC_MARKET.id);
  const itemList: JsonLdGraph = { "@context": "https://schema.org", "@type": "ItemList", itemListElement: apartments.map((item, index) => ({ "@type": "ListItem", position: index + 1, item: absoluteUrl(`/apartments/${item.slug}`), name: item.title })) };
  return <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
    <JsonLdScript data={itemList} />
    <div className="max-w-3xl"><p className="text-sm font-semibold uppercase tracking-wider text-wine">Жильё от платформы и организаторов</p><h1 className="mt-2 font-heading text-4xl font-bold">Апартаменты в Аргентине</h1><p className="mt-4 text-lg leading-8 text-slate">Выберите вариант и отправьте запрос на даты. Мы не обещаем мгновенное подтверждение: владелец сначала проверит календарь и условия.</p></div>
    {apartments.length ? <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">{apartments.map((item) => <Link key={item.id} href={`/apartments/${item.slug}`} className="group overflow-hidden rounded-3xl border border-border-subtle bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-surface-elevated">
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-muted"><SafeImage src={item.images[0]?.mediaRef ?? ""} alt={item.images[0]?.altText ?? item.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition duration-300 group-hover:scale-[1.02]" /></div>
      <div className="p-5"><p className="text-xs font-semibold uppercase tracking-wide text-sky-ink">{item.locality}, {item.region}</p><h2 className="mt-2 font-heading text-xl font-bold">{item.title}</h2><p className="mt-2 line-clamp-2 text-sm text-slate">{item.summary}</p><div className="mt-4 flex items-end justify-between gap-3"><span className="font-bold">от {money(item.nightlyPriceMinor, item.currency)} / ночь</span><span className="text-xs text-slate">до {item.maxGuests} гостей</span></div></div>
    </Link>)}</div> : <div className="mt-10 rounded-3xl bg-surface-muted p-8"><h2 className="font-heading text-xl font-bold">Каталог пока пополняется</h2><p className="mt-2 text-slate">Опубликованные объекты появятся здесь после проверки администратором.</p></div>}
  </main>;
}
