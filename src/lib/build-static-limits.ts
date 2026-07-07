/**
 * Ограничение числа страниц при `generateStaticParams` на Vercel.
 * Остальные маршруты доступны через ISR (`dynamicParams` + `revalidate`).
 */
export function capBuildStaticParams<T>(items: readonly T[], maxOnVercel = 120): T[] {
  if (!process.env.VERCEL) return [...items];
  return items.slice(0, maxOnVercel);
}
