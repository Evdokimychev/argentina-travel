import type { BookingPaymentGateway } from "@/types/booking-payment";

export type OnlinePaymentGateway = Exclude<BookingPaymentGateway, "manual">;

export function isMercadoPagoAvailableOnClient(): boolean {
  const fromPublic = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY?.trim();
  return Boolean(fromPublic);
}

export function isStripeAvailableOnClient(): boolean {
  const flag = process.env.NEXT_PUBLIC_STRIPE_ENABLED?.trim().toLowerCase();
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();
  if (flag === "true") return Boolean(publishableKey);
  if (flag === "false") return false;
  return Boolean(publishableKey);
}

export function resolveClientPaymentProviders(): OnlinePaymentGateway[] {
  const providers: OnlinePaymentGateway[] = [];
  if (isMercadoPagoAvailableOnClient()) providers.push("mercadopago");
  if (isStripeAvailableOnClient()) providers.push("stripe");
  return providers;
}

export function resolveDefaultPaymentProvider(): OnlinePaymentGateway | null {
  const providers = resolveClientPaymentProviders();
  if (providers.length === 0) return null;
  if (providers.length === 1) return providers[0];
  if (providers.includes("mercadopago")) return "mercadopago";
  return providers[0];
}

export const PAYMENT_GATEWAY_LABELS: Record<OnlinePaymentGateway, string> = {
  mercadopago: "Mercado Pago",
  stripe: "Stripe (карта)",
};
