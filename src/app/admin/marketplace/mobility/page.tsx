import MobilityInventoryWorkspace from "@/components/mobility/MobilityInventoryWorkspace";

export default function AdminMobilityPage() {
  return <div className="space-y-6"><div><h1 className="text-2xl font-bold text-slate-950">Авто и трансферы</h1><p className="mt-2 text-sm text-slate-600">Проверка источников, транспорта и предложений без доступа к контактам туристов в каталоге.</p></div><MobilityInventoryWorkspace mode="admin" /></div>;
}
