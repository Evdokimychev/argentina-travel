import type { Metadata } from "next";
import AboutArgentinaView from "@/components/guide/AboutArgentinaView";

export const metadata: Metadata = {
  title: "Об Аргентине — путеводитель",
  description:
    "География, регионы, сезоны и маршруты по Аргентине: Buenos Aires, Patagonia, Iguazú, Mendoza и Salta — с ссылками на туры и практические темы.",
  alternates: {
    canonical: "/guide/ob-argentine",
  },
};

export default function AboutArgentinaPage() {
  return <AboutArgentinaView />;
}
