import { getDeployEnvironment } from "@/lib/ops/deploy-env";
import { isMercadoPagoConfigured } from "@/lib/payments/mercadopago-client";

function isTruthyEnv(value: string | undefined): boolean {
  const normalized = value?.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

/** Server-side: sandbox payments allowed (demo / local dev without live gateways). */
export function isPaymentSandboxMode(): boolean {
  if (isTruthyEnv(process.env.PAYMENT_SANDBOX_MODE)) return true;

  const { deployEnv, nodeEnv } = getDeployEnvironment();
  if (deployEnv === "production" || deployEnv === "staging") {
    return false;
  }

  if (nodeEnv === "development" || deployEnv === "development") {
    if (!isMercadoPagoConfigured() && !isStripeConfigured()) return true;
  }

  return false;
}

/** Guard for sandbox payment API — production requires explicit PAYMENT_SANDBOX_MODE. */
export function assertPaymentSandboxAllowed():
  | { ok: true }
  | { ok: false; reason: string } {
  const { deployEnv } = getDeployEnvironment();

  if (deployEnv === "production" && !isTruthyEnv(process.env.PAYMENT_SANDBOX_MODE)) {
    return { ok: false, reason: "Песочница оплат отключена в production" };
  }

  if (!isPaymentSandboxMode()) {
    return { ok: false, reason: "Режим песочницы оплат не активен" };
  }

  return { ok: true };
}
