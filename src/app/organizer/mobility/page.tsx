import type { Metadata } from "next";
import MobilityInventoryWorkspace from "@/components/mobility/MobilityInventoryWorkspace";

export const metadata: Metadata = { title: "Авто и трансферы — кабинет организатора" };

export default function OrganizerMobilityPage() {
  return <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6"><div><h1 className="text-2xl font-bold text-slate-950">Авто и трансферы</h1><p className="mt-2 text-sm text-slate-600">Единый парк, отдельные условия аренды и маршруты трансферов.</p></div><MobilityInventoryWorkspace mode="organizer" /></div>;
}
