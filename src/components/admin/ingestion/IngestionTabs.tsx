"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BookCheck, Bot, DatabaseZap, ListRestart } from "lucide-react";
import { cn } from "@/lib/cn";

const tabs = [
  ["/admin/ingestion", "Состояние", Activity],
  ["/admin/ingestion/sources", "Источники", DatabaseZap],
  ["/admin/ingestion/runs", "Запуски", ListRestart],
  ["/admin/ingestion/moderation", "Разбор материалов", BookCheck],
  ["/admin/ingestion/prompts", "Правила анализа", Bot],
] as const;

export default function IngestionTabs() {
  const pathname = usePathname();
  return <nav className="flex gap-1 overflow-x-auto border-b border-border-subtle" aria-label="Сбор и обработка данных">
    {tabs.map(([href, label, Icon]) => { const active = href === "/admin/ingestion" ? pathname === href : pathname.startsWith(href); return <Link key={href} href={href} className={cn("inline-flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-3 text-sm font-medium", active ? "border-sky text-sky" : "border-transparent text-muted hover:text-foreground")}><Icon className="h-4 w-4" aria-hidden />{label}</Link>; })}
  </nav>;
}
