export type PartnerTransitionOutcome = "order_created" | "partner_handoff";

export function partnerTransitionTitle(outcome: PartnerTransitionOutcome): string {
  return outcome === "order_created" ? "Заказ создан у партнёра" : "Продолжите у партнёра";
}

export function partnerTransitionMessage(input: {
  outcome: PartnerTransitionOutcome;
  productType: "tour" | "excursion";
  partnerLabel: string;
}): string {
  const product = input.productType === "tour" ? "тура" : "экскурсии";
  if (input.outcome === "order_created") {
    return `Заказ ${product} создан у ${input.partnerLabel}. Проверьте условия и завершите оформление на сайте партнёра.`;
  }
  return `Заказ ${product} ещё не создан. Завершите бронирование и укажите контакты на сайте ${input.partnerLabel}.`;
}
