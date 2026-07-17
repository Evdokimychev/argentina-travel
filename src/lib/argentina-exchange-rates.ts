const REVALIDATE_SECONDS = 1800;

const BCRA_USD_URL =
  "https://api.bcra.gob.ar/estadisticascambiarias/v1.0/Cotizaciones/USD";
const DOLAR_API_BLUE_URL = "https://dolarapi.com/v1/dolares/blue";

type BcraResponse = {
  status: number;
  results: Array<{
    fecha: string;
    detalle: Array<{
      codigoMoneda: string;
      tipoCotizacion: number;
    }>;
  }>;
};

type DolarApiResponse = {
  compra: number;
  venta: number;
  fechaActualizacion: string;
};

function isFinitePositive(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function parseBcraUsd(value: unknown): ExchangeRateQuote | null {
  if (!value || typeof value !== "object") return null;
  const payload = value as Partial<BcraResponse>;
  const result = payload.results?.[0];
  const usd = result?.detalle?.find((item) => item.codigoMoneda === "USD");
  if (!result?.fecha || !isFinitePositive(usd?.tipoCotizacion)) return null;
  return {
    reference: usd.tipoCotizacion,
    updatedAt: `${result.fecha}T12:00:00-03:00`,
    sourceName: "Banco Central Аргентины (BCRA)",
    sourceUrl: "https://www.bcra.gob.ar/apis-banco-central/",
    sourceKind: "official",
  };
}

function parseBlueQuote(value: unknown): ExchangeRateQuote | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Partial<DolarApiResponse>;
  if (
    !isFinitePositive(record.compra) ||
    !isFinitePositive(record.venta) ||
    typeof record.fechaActualizacion !== "string"
  ) {
    return null;
  }
  return {
    buy: record.compra,
    sell: record.venta,
    updatedAt: record.fechaActualizacion,
    sourceName: "DolarApi",
    sourceUrl: "https://dolarapi.com/",
    sourceKind: "informal_reference",
  };
}

export type ExchangeRateQuote = {
  buy?: number;
  sell?: number;
  reference?: number;
  updatedAt: string;
  sourceName: string;
  sourceUrl: string;
  sourceKind: "official" | "informal_reference";
};

export type ArgentinaExchangeRatesData = {
  oficial: ExchangeRateQuote;
  blue?: ExchangeRateQuote;
};

export type ArgentinaExchangeRatesResult =
  | { ok: true; data: ArgentinaExchangeRatesData }
  | { ok: false; error: string };

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, {
    next: { revalidate: REVALIDATE_SECONDS },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

export async function getArgentinaExchangeRates(): Promise<ArgentinaExchangeRatesResult> {
  try {
    const oficial = parseBcraUsd(await fetchJson(BCRA_USD_URL));
    if (!oficial) throw new Error("BCRA returned an invalid USD quote");

    let blue: ExchangeRateQuote | undefined;
    try {
      blue = parseBlueQuote(await fetchJson(DOLAR_API_BLUE_URL)) ?? undefined;
    } catch {
      // The unofficial reference is optional; the official BCRA quote remains useful.
    }

    return { ok: true, data: { oficial, blue } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Неизвестная ошибка",
    };
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

export function latestExchangeRateUpdate(data: ArgentinaExchangeRatesData): string {
  const dates = [data.oficial.updatedAt, data.blue?.updatedAt].filter(
    (value): value is string => Boolean(value),
  );
  return dates.reduce((latest, current) =>
    new Date(current).getTime() > new Date(latest).getTime() ? current : latest,
  );
}
