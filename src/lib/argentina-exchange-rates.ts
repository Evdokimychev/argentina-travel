const REVALIDATE_SECONDS = 3600;
const BCRA_USD_URL = "https://api.bcra.gob.ar/estadisticascambiarias/v1.0/Cotizaciones/USD";

type BcraCurrencyDetail = {
  codigoMoneda: string;
  descripcion: string;
  tipoCotizacion: number;
};

type BcraCurrencyResult = {
  fecha: string;
  detalle: BcraCurrencyDetail[];
};

type BcraCurrencyResponse = {
  status: number;
  results: BcraCurrencyResult[];
};

function isBcraCurrencyResponse(value: unknown): value is BcraCurrencyResponse {
  if (!value || typeof value !== "object") return false;
  const response = value as Partial<BcraCurrencyResponse>;
  return (
    response.status === 200 &&
    Array.isArray(response.results) &&
    response.results.some(
      (result) =>
        typeof result?.fecha === "string" &&
        Array.isArray(result.detalle) &&
        result.detalle.some(
          (detail) =>
            detail?.codigoMoneda === "USD" &&
            typeof detail.tipoCotizacion === "number" &&
            Number.isFinite(detail.tipoCotizacion)
        )
    )
  );
}

export type ArgentinaOfficialExchangeRate = {
  rate: number;
  observedAt: string;
  sourceName: "Banco Central de la República Argentina";
  sourceUrl: typeof BCRA_USD_URL;
  rateType: "official_reference";
};

export type ArgentinaExchangeRatesResult =
  | { ok: true; data: ArgentinaOfficialExchangeRate }
  | { ok: false; error: string };

export function parseBcraUsdQuote(payload: unknown): ArgentinaOfficialExchangeRate | null {
  if (!isBcraCurrencyResponse(payload)) return null;
  const result = payload.results.find((item) =>
    item.detalle.some((detail) => detail.codigoMoneda === "USD")
  );
  const detail = result?.detalle.find((item) => item.codigoMoneda === "USD");
  if (!result || !detail) return null;

  return {
    rate: detail.tipoCotizacion,
    observedAt: `${result.fecha}T12:00:00-03:00`,
    sourceName: "Banco Central de la República Argentina",
    sourceUrl: BCRA_USD_URL,
    rateType: "official_reference",
  };
}

export async function getArgentinaExchangeRates(): Promise<ArgentinaExchangeRatesResult> {
  try {
    const response = await fetch(BCRA_USD_URL, {
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(10_000),
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`BCRA: HTTP ${response.status}`);

    const quote = parseBcraUsdQuote(await response.json());
    if (!quote) throw new Error("BCRA: invalid payload");
    return { ok: true, data: quote };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Неизвестная ошибка" };
  }
}

export function formatArsRate(value: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatExchangeRateUpdatedAt(isoDate: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date(isoDate));
}
