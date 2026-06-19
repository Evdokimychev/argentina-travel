"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, ShoppingBag } from "lucide-react";
import type { ShopProduct } from "@/data/shop-products";
import { useAuth } from "@/context/AuthContext";
import { apiCreateShopOrder } from "@/lib/shop-order-api";
import type { ShopOrder } from "@/types/shop-order";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import FormattedPrice from "@/components/FormattedPrice";
import InlineFeedback from "@/components/feedback/InlineFeedback";
import { useSiteFeedback } from "@/context/SiteFeedbackContext";
import { normalizeSiteError } from "@/lib/site-feedback/normalize-error";
import type { SiteFeedbackMessage } from "@/types/site-feedback";

interface ShopCheckoutModalProps {
  product: ShopProduct;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "form" | "success";

export default function ShopCheckoutModal({
  product,
  open,
  onOpenChange,
}: ShopCheckoutModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("form");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<SiteFeedbackMessage | null>(null);
  const [order, setOrder] = useState<ShopOrder | null>(null);
  const feedback = useSiteFeedback();

  useEffect(() => {
    if (!open) return;
    setStep("form");
    setError(null);
    setOrder(null);
    setCustomerName(user?.fullName ?? "");
    setCustomerEmail(user?.email ?? "");
    setCustomerPhone(user?.phone ?? "");
    setNotes("");
  }, [open, user]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const created = await apiCreateShopOrder({
        productSlug: product.slug,
        customerName,
        customerEmail,
        customerPhone,
        notes: notes.trim() || undefined,
      });
      setOrder(created);
      setStep("success");
      feedback.success({
        title: "Заказ оформлен",
        description: "Менеджер свяжется с вами для оплаты и отправки PDF на email.",
      });
    } catch (submitError) {
      const normalized = normalizeSiteError(submitError, {
        title: "Не удалось оформить заказ",
        steps: ["Проверьте email и телефон", "Попробуйте ещё раз через минуту"],
        action: { label: "Связаться с нами", href: "/contacts" },
      });
      setError(normalized);
      feedback.showError(normalized);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden p-0">
        {step === "form" ? (
          <form onSubmit={handleSubmit} className="flex flex-col">
            <div className="border-b border-gray-100 px-6 py-5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate">Заказ PDF</p>
              <h2 className="mt-1 font-heading text-xl font-bold text-charcoal">{product.title}</h2>
              <p className="mt-2 text-sm text-slate">{product.format}</p>
              <FormattedPrice priceUsd={product.price} className="mt-3 text-lg font-bold" />
            </div>

            <div className="space-y-4 px-6 py-5">
              <p className="text-sm leading-relaxed text-slate">
                Оплата на сайте пока недоступна. После заказа менеджер свяжется с вами и отправит
                ссылку на оплату или счёт. PDF придёт на email после подтверждения оплаты.
              </p>

              {error ? (
                <InlineFeedback
                  variant="error"
                  title={error.title}
                  description={error.description}
                  steps={error.steps}
                  action={error.action}
                />
              ) : null}

              <div>
                <label htmlFor="shop-checkout-name" className="text-sm font-medium text-charcoal">
                  Имя
                </label>
                <Input
                  id="shop-checkout-name"
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  required
                  autoComplete="name"
                  className="mt-1.5"
                />
              </div>

              <div>
                <label htmlFor="shop-checkout-email" className="text-sm font-medium text-charcoal">
                  Email
                </label>
                <Input
                  id="shop-checkout-email"
                  type="email"
                  value={customerEmail}
                  onChange={(event) => setCustomerEmail(event.target.value)}
                  required
                  autoComplete="email"
                  className="mt-1.5"
                />
              </div>

              <div>
                <label htmlFor="shop-checkout-phone" className="text-sm font-medium text-charcoal">
                  Телефон
                </label>
                <Input
                  id="shop-checkout-phone"
                  type="tel"
                  value={customerPhone}
                  onChange={(event) => setCustomerPhone(event.target.value)}
                  autoComplete="tel"
                  className="mt-1.5"
                />
              </div>

              <div>
                <label htmlFor="shop-checkout-notes" className="text-sm font-medium text-charcoal">
                  Комментарий (необязательно)
                </label>
                <Textarea
                  id="shop-checkout-notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={3}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 border-t border-gray-100 px-6 py-4 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Отмена
              </Button>
              <Button type="submit" loading={submitting} loadingLabel="Отправка…">
                Оформить заказ
              </Button>
            </div>
          </form>
        ) : (
          <div className="px-6 py-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Check className="h-7 w-7" aria-hidden />
            </div>
            <h2 className="mt-4 font-heading text-xl font-bold text-charcoal">Заказ принят</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate">
              Номер заказа: <span className="font-medium text-charcoal">{order?.id}</span>.
              Менеджер свяжется с вами для оплаты и отправит PDF на{" "}
              <span className="font-medium text-charcoal">{order?.customerEmail}</span>.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              {user ? (
                <Link
                  href="/profile/orders"
                  className="inline-flex h-10 items-center justify-center rounded-full border border-gray-200 px-4 text-sm font-medium text-charcoal transition-colors hover:border-sky/40 hover:text-sky"
                >
                  Мои заказы
                </Link>
              ) : null}
              <Button onClick={() => onOpenChange(false)}>
                <ShoppingBag className="mr-2 h-4 w-4" aria-hidden />
                Продолжить
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
