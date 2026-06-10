"use client";

import dynamic from "next/dynamic";

const DomesticRoutesMap = dynamic(() => import("@/components/guide/hub/DomesticRoutesMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[420px] items-center justify-center rounded-2xl border border-gray-200 bg-surface-muted/40 text-sm text-slate">
      Загрузка карты маршрутов…
    </div>
  ),
});

export default function DomesticRoutesMapSection() {
  return <DomesticRoutesMap />;
}
