import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const dynamicParams = false;

export async function generateStaticParams() {
  return [];
}

export function generateMetadata(): Metadata {
  return {
    title: "Материал недоступен",
    robots: { index: false, follow: false },
  };
}

export default function ImmigrationArticlePage() {
  notFound();
}
