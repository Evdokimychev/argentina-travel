import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MobilityCatalogClient from "@/components/mobility/MobilityCatalogClient";
import { resolveMobilityModuleAccess } from "@/lib/mobility/module-policy-server";
import { isMobilityVertical } from "@/types/mobility";

export const metadata: Metadata = {
  title: "Авто и трансферы — Пора в Аргентину",
  description: "Собственные предложения и независимые партнёрские варианты аренды авто и трансферов.",
  robots: { index: false, follow: true },
};

export default async function MobilityPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const vertical = isMobilityVertical(params.vertical) ? params.vertical : null;
  const marketId = typeof params.marketId === "string" && /^[a-z0-9][a-z0-9_-]{1,39}$/.test(params.marketId) ? params.marketId : null;
  if (vertical) {
    const access = await resolveMobilityModuleAccess(vertical);
    if (!access.allowed) notFound();
  } else {
    const [rental, transfer] = await Promise.all([
      resolveMobilityModuleAccess("rental"),
      resolveMobilityModuleAccess("transfer"),
    ]);
    if (!rental.allowed && !transfer.allowed) notFound();
  }
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-12 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">Мобильность</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-950 sm:text-4xl">Автомобили и трансферы без ложных обещаний</h1>
      <p className="mt-3 max-w-3xl text-slate-600">Собственные предложения оформляются как заявка с последующим подтверждением. LocalRent и Intui остаются отдельными партнёрскими каналами.</p>
      <div className="mt-8"><MobilityCatalogClient vertical={vertical} marketId={marketId} /></div>
    </main>
  );
}
