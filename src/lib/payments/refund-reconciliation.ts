import type {
  PaymentTransactionRow,
  RefundReconciliationCandidate,
  RefundReconciliationView,
} from "@/types/payment-platform";

type ProviderRefund = {
  providerRefundId: string;
  status: string;
  amount: number;
  currency: string | null;
  createdAt: string | null;
  sourcePaymentId: string;
  providerRefundTransactionId?: string;
};

function baseView(
  refund: PaymentTransactionRow,
  sourcePaymentId: string | null,
  input: Omit<RefundReconciliationView, "provider" | "sourcePaymentId" | "safeToMutate">,
): RefundReconciliationView {
  return {
    provider: refund.provider,
    sourcePaymentId,
    safeToMutate: false,
    ...input,
  };
}

function normalizedMoney(value: number): number {
  return Math.round(value * 100);
}

export function classifyRefundReconciliation(
  refund: PaymentTransactionRow,
  sourceCharge: PaymentTransactionRow | null,
  providerRefunds: ProviderRefund[],
): RefundReconciliationView {
  const sourcePaymentId = sourceCharge?.externalId ?? null;
  if (refund.type !== "refund" || refund.status !== "processing" || refund.provider === "manual") {
    return baseView(refund, sourcePaymentId, {
      classification: "not_applicable",
      message: "Сверка нужна только для возврата в статусе «В обработке».",
      requiredNextStep: "Действий по восстановлению не требуется.",
      candidates: [],
    });
  }
  if (!sourceCharge || sourceCharge.type !== "charge" || !sourcePaymentId) {
    return baseView(refund, sourcePaymentId, {
      classification: "unavailable",
      message: "Не найдено исходное списание с идентификатором провайдера.",
      requiredNextStep: "Восстановить связь с исходным списанием до любых действий у провайдера.",
      candidates: [],
    });
  }

  const sameMoney = (candidate: ProviderRefund): boolean =>
    normalizedMoney(candidate.amount) === normalizedMoney(refund.amount) &&
    (!candidate.currency || candidate.currency.toUpperCase() === refund.currency.toUpperCase());
  const sameSource = (candidate: ProviderRefund): boolean =>
    candidate.sourcePaymentId === sourcePaymentId;
  const exact = providerRefunds.filter((candidate) =>
    sameSource(candidate) &&
    sameMoney(candidate) &&
    ((refund.externalId && candidate.providerRefundId === refund.externalId) ||
      candidate.providerRefundTransactionId === refund.id)
  );
  const amountCandidates = providerRefunds.filter((candidate) => sameSource(candidate) && sameMoney(candidate));

  const toCandidate = (candidate: ProviderRefund): RefundReconciliationCandidate => ({
    providerRefundId: candidate.providerRefundId,
    status: candidate.status,
    amount: candidate.amount,
    currency: candidate.currency,
    createdAt: candidate.createdAt,
    correlation:
      refund.externalId === candidate.providerRefundId
        ? "external_id"
        : candidate.providerRefundTransactionId === refund.id
          ? "provider_metadata"
          : "amount_only",
  });

  if (exact.length === 1) {
    return baseView(refund, sourcePaymentId, {
      classification: "exact_match",
      message: "Провайдер вернул один возврат с точной корреляцией и совпадающей суммой.",
      requiredNextStep:
        "Не повторять POST. После проверки migration journal нужен атомарный recovery lease и CAS-finalize по этому provider refund ID.",
      candidates: exact.map(toCandidate),
    });
  }
  if (exact.length > 1 || amountCandidates.length > 1) {
    return baseView(refund, sourcePaymentId, {
      classification: "ambiguous",
      message: "Найдено несколько подходящих возвратов; автоматическое сопоставление небезопасно.",
      requiredNextStep: "Провести ручную финансовую сверку. Не отправлять повторный refund POST.",
      candidates: (exact.length > 1 ? exact : amountCandidates).map(toCandidate),
    });
  }
  if (amountCandidates.length === 1) {
    return baseView(refund, sourcePaymentId, {
      classification: "candidate",
      message: "Найден возврат с той же суммой, но без устойчивой корреляции с локальной операцией.",
      requiredNextStep:
        "Считать результат неопределённым и сверить вручную; совпадение суммы не разрешает finalize или повторный POST.",
      candidates: amountCandidates.map(toCandidate),
    });
  }
  return baseView(refund, sourcePaymentId, {
    classification: "not_found",
    message: "Провайдер не вернул подходящий возврат для исходного списания.",
    requiredNextStep:
      "Не повторять POST без атомарного recovery lease: отсутствие в списке не доказывает, что первый запрос не исполняется.",
    candidates: [],
  });
}

export async function inspectRefundReconciliation(
  refund: PaymentTransactionRow,
  sourceCharge: PaymentTransactionRow | null,
): Promise<RefundReconciliationView> {
  if (refund.type !== "refund" || refund.status !== "processing" || refund.provider === "manual") {
    return classifyRefundReconciliation(refund, sourceCharge, []);
  }
  const sourcePaymentId = sourceCharge?.externalId?.trim() ?? "";
  if (!sourcePaymentId) return classifyRefundReconciliation(refund, sourceCharge, []);

  try {
    if (refund.provider === "stripe") {
      const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
      if (!secretKey) throw new Error("stripe_not_configured");
      const { listStripeRefundsForPayment } = await import("@/lib/payments/stripe-client");
      const refunds = await listStripeRefundsForPayment({
        secretKey,
        paymentIntentId: sourcePaymentId.startsWith("pi_") ? sourcePaymentId : undefined,
        chargeId: sourcePaymentId.startsWith("ch_") ? sourcePaymentId : undefined,
      });
      return classifyRefundReconciliation(
        refund,
        sourceCharge,
        refunds.map((candidate) => ({
          providerRefundId: candidate.id,
          status: candidate.status,
          amount: candidate.amount,
          currency: candidate.currency,
          createdAt: candidate.created ? new Date(candidate.created * 1000).toISOString() : null,
          sourcePaymentId: candidate.paymentIntentId ?? candidate.chargeId ?? sourcePaymentId,
          providerRefundTransactionId:
            typeof candidate.metadata.goargentinaRefundId === "string"
              ? candidate.metadata.goargentinaRefundId
              : undefined,
        })),
      );
    }

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
    if (!accessToken) throw new Error("mercadopago_not_configured");
    const { fetchMercadoPagoRefunds } = await import("@/lib/payments/mercadopago-client");
    const refunds = await fetchMercadoPagoRefunds({ paymentId: sourcePaymentId, accessToken });
    return classifyRefundReconciliation(
      refund,
      sourceCharge,
      refunds.map((candidate) => ({
        providerRefundId: candidate.refundId,
        status: candidate.status,
        amount: candidate.amount,
        currency: null,
        createdAt: candidate.dateCreated ?? null,
        sourcePaymentId: candidate.paymentId,
      })),
    );
  } catch {
    return baseView(refund, sourcePaymentId, {
      classification: "unavailable",
      message: "Не удалось получить read-only список возвратов у платёжного провайдера.",
      requiredNextStep: "Повторить только чтение позже; не отправлять refund POST.",
      candidates: [],
    });
  }
}
