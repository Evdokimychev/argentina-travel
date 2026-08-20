/**
 * Race a promise against a timeout. Rejects with a labeled Error on timeout.
 */
export async function withBudget<T>(
  label: string,
  budgetMs: number,
  work: () => Promise<T>,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work(),
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`[budget_exceeded] ${label} exceeded ${budgetMs}ms`));
        }, budgetMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function withBudgetFallback<T>(
  label: string,
  budgetMs: number,
  work: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await withBudget(label, budgetMs, work);
  } catch (error) {
    console.error("[sitemap_collector_budget]", {
      label,
      message: error instanceof Error ? error.message : String(error),
    });
    return fallback;
  }
}
