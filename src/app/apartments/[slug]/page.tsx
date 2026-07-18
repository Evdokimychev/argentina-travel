import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SafeImage } from "@/components/ui/safe-image";
import JsonLdScript from "@/components/seo/JsonLdScript";
import ApartmentInquiryForm from "@/components/apartments/ApartmentInquiryForm";
import { getPublishedApartment } from "@/lib/apartments/apartment-repository-server";
import { fetchSiteModules } from "@/lib/site-settings-server";
import { buildPublicPageMetadata } from "@/lib/page-metadata";
import { absoluteUrl } from "@/lib/site-url";
import type { JsonLdGraph } from "@/lib/schema-json-ld";
import { PRIMARY_PUBLIC_MARKET } from "@/lib/market-context";

type Props = { params: Promise<{ slug: string }> };
export const dynamic = "force-dynamic";
function money(minor: number, currency: string) { return new Intl.NumberFormat("ru-RU", { style: "currency", currency, maximumFractionDigits: 0 }).format(minor / 100); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const modules = await fetchSiteModules();
  if (modules.apartmentsMode !== "native_request") return {};
  const apartment = await getPublishedApartment((await params).slug, PRIMARY_PUBLIC_MARKET.id);
  if (!apartment) return {};
  return buildPublicPageMetadata({ title: apartment.title, description: apartment.summary, path: `/apartments/${apartment.slug}`, image: apartment.images[0]?.mediaRef });
}

export default async function ApartmentDetailPage({ params }: Props) {
  const modules = await fetchSiteModules();
  if (modules.apartmentsMode !== "native_request") notFound();
  const apartment = await getPublishedApartment((await params).slug, PRIMARY_PUBLIC_MARKET.id);
  if (!apartment) notFound();
  const jsonLd: JsonLdGraph = { "@context": "https://schema.org", "@type": "Apartment", name: apartment.title, description: apartment.summary, url: absoluteUrl(`/apartments/${apartment.slug}`), image: apartment.images.map((item) => item.mediaRef), occupancy: { "@type": "QuantitativeValue", maxValue: apartment.maxGuests }, containedInPlace: { "@type": "Place", name: `${apartment.locality}, ${apartment.region}, ${apartment.countryCode}` } };
  return <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"><JsonLdScript data={jsonLd} />
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
      <article><div className="grid gap-3 sm:grid-cols-2">{apartment.images.map((image, index) => <div key={`${image.mediaRef}-${index}`} className={`relative overflow-hidden rounded-3xl bg-surface-muted ${index === 0 ? "aspect-[16/10] sm:col-span-2" : "aspect-[4/3]"}`}><SafeImage src={image.mediaRef} alt={image.altText} fill sizes="(max-width: 1024px) 100vw, 66vw" className="object-cover" /></div>)}</div>
        <p className="mt-7 text-sm font-semibold uppercase tracking-wide text-wine">{apartment.locality}, {apartment.region}</p><h1 className="mt-2 font-heading text-4xl font-bold">{apartment.title}</h1><p className="mt-4 text-lg leading-8 text-slate">{apartment.description}</p>
        <div className="mt-7 grid gap-3 sm:grid-cols-4">{[["Гостей", apartment.maxGuests], ["Спален", apartment.bedrooms], ["Кроватей", apartment.beds], ["Ванных", apartment.bathrooms]].map(([label, value]) => <div key={label} className="rounded-2xl bg-surface-muted p-4"><p className="text-xs text-slate">{label}</p><p className="mt-1 text-xl font-bold">{value}</p></div>)}</div>
        <section className="mt-8"><h2 className="font-heading text-2xl font-bold">Условия</h2><ul className="mt-3 grid gap-2 sm:grid-cols-2">{apartment.amenities.map((item) => <li key={item} className="rounded-xl border border-border-subtle px-3 py-2 text-sm">{item}</li>)}</ul><p className="mt-4 text-sm text-slate">Район: {apartment.publicLocationNote || `${apartment.locality}, без публикации точного адреса`}. Точный адрес сообщается только после согласования.</p><p className="mt-3 text-sm text-slate">Отмена: {apartment.cancellationDisclosure}</p>{apartment.depositMinor !== null ? <p className="mt-2 text-sm text-slate">Депозит: {money(apartment.depositMinor, apartment.currency)}. {apartment.depositDisclosure}</p> : <p className="mt-2 text-sm text-slate">Депозит не заявлен.</p>}</section>
      </article>
      <aside className="lg:sticky lg:top-24 lg:self-start"><div className="mb-4 rounded-2xl bg-surface-muted p-4"><p className="text-2xl font-bold">{money(apartment.nightlyPriceMinor, apartment.currency)} <span className="text-sm font-normal text-slate">за ночь</span></p><p className="mt-1 text-xs text-slate">Валюта и цена фиксируются в заявке; итог подтверждается до бронирования.</p></div><ApartmentInquiryForm slug={apartment.slug} maxGuests={apartment.maxGuests} minimumStayNights={apartment.minimumStayNights} /></aside>
    </div>
  </main>;
}
