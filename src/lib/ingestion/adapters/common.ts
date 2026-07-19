import type { AdapterHealth, AdapterRawItem, IngestionSourceRecord, SourceAdapter } from "@/types/ingestion";
import { normalizeRawItem } from "@/lib/ingestion/content-intelligence";

export function validation(errors: Array<string | false | null | undefined>) {
  const compact = errors.filter(Boolean) as string[];
  return compact.length ? { ok: false as const, errors: compact } : { ok: true as const };
}

export async function timedHealth(action: () => Promise<unknown>): Promise<AdapterHealth> {
  const started = Date.now();
  try {
    await action();
    return { ok: true, message: "Соединение установлено", latencyMs: Date.now() - started };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Неизвестная ошибка", latencyMs: Date.now() - started };
  }
}

export function withCommonAdapterMethods<T extends Pick<SourceAdapter, "type" | "validateConfig" | "fetch">>(adapter: T): SourceAdapter {
  return {
    ...adapter,
    testConnection: async (source) => timedHealth(async () => { const result = await adapter.fetch({ ...source, connectionConfig: { ...source.connectionConfig, limit: 1 } }); if (!result.items.length) throw new Error("Источник не вернул материалов"); }),
    healthCheck: async (source) => timedHealth(async () => { const result = await adapter.fetch({ ...source, connectionConfig: { ...source.connectionConfig, limit: 1 } }); if (!result.items.length) throw new Error("Нет доступных материалов"); }),
    parse: async (item: AdapterRawItem) => item,
    normalize: async (item: AdapterRawItem, source: IngestionSourceRecord) => normalizeRawItem(item, source),
    checkpoint: (result) => result.checkpoint,
  };
}

export function getPath(value: unknown, path: string): unknown {
  return path.split(".").filter(Boolean).reduce<unknown>((current, key) => {
    if (Array.isArray(current)) return current[Number(key)];
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[key];
  }, value);
}
