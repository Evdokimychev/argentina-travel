const REVALIDATE_SECONDS = 1800;

const DOLAR_API_BASE = "https://dolarapi.com/v1/dolares";

type DolarApiResponse = {
  compra: number;
  venta: number;
  fechaActualizacion: string;
};

function isDolarApiResponse(value: unknown): value is DolarApiResponse {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.compra === "number" &&
    Number.isFinite(record.compra) &&
    typeof record.venta === "number" &&
    Number.isFinite(record.venta) &&
    typeof record.fechaActualizacion === "string"
  );
}


export type ExchangeRateQuote = {
  buy: number;
  sell: number;
  updatedAt: string;
};

export type ArgentinaExchangeRatesData = {
  oficial: ExchangeRateQuote;
  blue: ExchangeRateQuote;
};

export type ArgentinaExchangeRatesResult =
  | { ok: true; data: ArgentinaExchangeRatesData }
  | { ok: false; error: string };

function mapQuote(raw: DolarApiResponse): ExchangeRateQuote {
  return {
    buy: raw.compra,
    sell: raw.venta,
    updatedAt: raw.fechaActualizacion,
  };
}

async function fetchDolarQuote(casa: "oficial" | "blue"): Promise<DolarApiResponse> {
  const response = await fetch(`${DOLAR_API_BASE}/${casa}`, {
    next: { revalidate: REVALIDATE_SECONDS },
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`Dolar API ${casa}: HTTP ${response.status}`);
  }

  const payload: unknown = await response.json();
  if (!isDolarApiResponse(payload)) {
    throw new Error(`Dolar API ${casa}: invalid payload`);
  }

  return payload;
}

export async function getArgentinaExchangeRates(): Promise<ArgentinaExchangeRatesResult> {
  try {
    const [oficialRaw, blueRaw] = await Promise.all([
      fetchDolarQuote("oficial"),
      fetchDolarQuote("blue"),
    ]);

    return {
      ok: true,
      data: {
        oficial: mapQuote(oficialRaw),
        blue: mapQuote(blueRaw),
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Неизвестная ошибка";
    return { ok: false, error: message };
  }
}

export function formatArsRate(value: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
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
  const oficialTime = new Date(data.oficial.updatedAt).getTime();
  const blueTime = new Date(data.blue.updatedAt).getTime();
  return oficialTime >= blueTime ? data.oficial.updatedAt : data.blue.updatedAt;
}
