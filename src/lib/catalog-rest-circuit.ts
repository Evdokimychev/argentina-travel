import "server-only";

import {
  classifyPartnerError,
  partnerUnavailable,
  type PartnerSourceResult,
} from "@/lib/partner-source-result";

export const CATALOG_REST_CIRCUIT_COOLDOWN_MS = 60_000;
const CIRCUIT_OPEN_MESSAGE = "catalog_rest_circuit_open:quota";

export class CatalogRestCircuitOpenError extends Error {
  constructor() {
    super(CIRCUIT_OPEN_MESSAGE);
    this.name = "CatalogRestCircuitOpenError";
  }
}

export function isCatalogRestCircuitOpenError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    error instanceof CatalogRestCircuitOpenError ||
    message.includes(CIRCUIT_OPEN_MESSAGE)
  );
}

export function shouldLogCatalogRestError(error: unknown): boolean {
  return !isCatalogRestCircuitOpenError(error);
}

type ProbeOutcome = "closed" | "open";
type CircuitState = "cold" | "closed" | "open" | "half_open";

export function createCatalogRestCircuit(options?: {
  cooldownMs?: number;
  now?: () => number;
  onOpen?: () => void;
}) {
  const cooldownMs = options?.cooldownMs ?? CATALOG_REST_CIRCUIT_COOLDOWN_MS;
  const now = options?.now ?? Date.now;
  let openUntil = 0;
  let state: CircuitState = "cold";
  let probe: Promise<ProbeOutcome> | null = null;

  function recordQuotaFailure(): void {
    const wasOpen = state === "open" && now() < openUntil;
    state = "open";
    openUntil = now() + cooldownMs;
    if (!wasOpen) options?.onOpen?.();
  }

  async function runObserved<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (classifyPartnerError(error) === "quota") recordQuotaFailure();
      throw error;
    }
  }

  async function runProbe<T>(operation: () => Promise<T>): Promise<T> {
    let resolveProbe!: (outcome: ProbeOutcome) => void;
    probe = new Promise<ProbeOutcome>((resolve) => {
      resolveProbe = resolve;
    });

    try {
      const value = await operation();
      state = "closed";
      openUntil = 0;
      resolveProbe("closed");
      return value;
    } catch (error) {
      if (classifyPartnerError(error) === "quota") {
        recordQuotaFailure();
        resolveProbe("open");
      } else {
        state = "closed";
        resolveProbe("closed");
      }
      throw error;
    } finally {
      probe = null;
    }
  }

  async function run<T>(operation: () => Promise<T>): Promise<T> {
    if (state === "open") {
      if (now() < openUntil) throw new CatalogRestCircuitOpenError();
      state = "half_open";
      return runProbe(operation);
    }

    if (state === "half_open") throw new CatalogRestCircuitOpenError();

    if (state === "cold" && probe) {
      const outcome = await probe;
      if (outcome === "open") throw new CatalogRestCircuitOpenError();
      return run(operation);
    }

    if (state === "cold") return runProbe(operation);
    return runObserved(operation);
  }

  return { run };
}

const sharedCatalogRestCircuit = createCatalogRestCircuit({
  onOpen: () => {
    console.error("[catalog_rest_circuit_open]", {
      errorClass: "quota",
      cooldownMs: CATALOG_REST_CIRCUIT_COOLDOWN_MS,
    });
  },
});

export function withCatalogRestCircuit<T>(operation: () => Promise<T>): Promise<T> {
  return sharedCatalogRestCircuit.run(operation);
}

class CatalogRestResultError extends Error {
  constructor(
    readonly result: Extract<PartnerSourceResult<never>, { status: "unavailable" }>,
  ) {
    super(result.message);
    this.name = "CatalogRestResultError";
  }
}

export async function withCatalogRestResultCircuit<T>(
  operation: () => Promise<PartnerSourceResult<T>>,
): Promise<PartnerSourceResult<T>> {
  try {
    return await withCatalogRestCircuit(async () => {
      const result = await operation();
      if (result.status === "unavailable") throw new CatalogRestResultError(result);
      return result;
    });
  } catch (error) {
    if (error instanceof CatalogRestResultError) return error.result;
    if (isCatalogRestCircuitOpenError(error)) {
      return partnerUnavailable("quota", CIRCUIT_OPEN_MESSAGE);
    }
    throw error;
  }
}
