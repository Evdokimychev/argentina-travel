"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CarFront, ExternalLink, Route } from "lucide-react";
import InlineFeedback from "@/components/feedback/InlineFeedback";
import TurnstileField from "@/components/forms/TurnstileField";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { resolveMobilityAction, selectMobilityCapabilities } from "@/lib/mobility/provider-registry";
import type { MobilityPublicCatalog, MobilityPublicOffer, MobilityVertical } from "@/types/mobility";

type Props = { vertical: MobilityVertical | null; marketId: string | null };

const COUNTRY_LABELS: Record<string, string> = { AR: "Аргентина", UY: "Уругвай" };

function money(minor: number, currency: string): string {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency }).format(minor / 100);
}

function providerDescription(capabilityMode: string): string {
  if (capabilityMode === "affiliate_handoff") return "Бронирование и расчёт выполняются на сайте партнёра";
  if (capabilityMode === "native_request") return "Заявка организатору через «Пора в Аргентину»";
  return "Этот способ сейчас не принимает заявки";
}

export default function MobilityCatalogClient({ vertical, marketId }: Props) {
  const [catalog, setCatalog] = useState<MobilityPublicCatalog | null>(null);
  const [loading, setLoading] = useState(Boolean(vertical && marketId));
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<MobilityPublicOffer | null>(null);
  const [sending, setSending] = useState(false);
  const sendingRef = useRef(false);
  const [handoffProviderId, setHandoffProviderId] = useState<string | null>(null);
  const handoffBusyRef = useRef(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaResetSignal, setCaptchaResetSignal] = useState(0);
  const idempotencyKeyRef = useRef<string | null>(null);
  const operationIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!vertical || !marketId) {
      setCatalog(null);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    idempotencyKeyRef.current = null;
    operationIdRef.current = null;
    setSelected(null);
    setCaptchaToken("");
    setSuccess(null);
    setLoading(true);
    setError(null);
    setCatalog(null);
    fetch(`/api/mobility/catalog?vertical=${encodeURIComponent(vertical)}&marketId=${encodeURIComponent(marketId)}`, { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({})) as { catalog?: MobilityPublicCatalog };
        if (!response.ok || !payload.catalog) throw new Error("catalog_unavailable");
        setCatalog(payload.catalog);
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setError("Не удалось загрузить варианты. Проверьте соединение и попробуйте ещё раз.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [marketId, vertical]);

  const providers = vertical && marketId && catalog
    ? selectMobilityCapabilities(catalog.providers, vertical, marketId)
    : [];

  function selectOffer(offer: MobilityPublicOffer) {
    idempotencyKeyRef.current = null;
    operationIdRef.current = null;
    setCaptchaToken("");
    setError(null);
    setSuccess(null);
    setSelected(offer);
  }

  function closeRequest() {
    if (sendingRef.current) return;
    idempotencyKeyRef.current = null;
    operationIdRef.current = null;
    setCaptchaToken("");
    setError(null);
    setSelected(null);
  }

  async function handoff(providerId: string, href: string) {
    if (handoffBusyRef.current) return;
    handoffBusyRef.current = true;
    setHandoffProviderId(providerId);
    const operationId = crypto.randomUUID();
    await fetch("/api/mobility/handoff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ providerId, vertical, marketId, operationId, placement: "mobility_catalog" }),
      keepalive: true,
    }).catch(() => undefined);
    window.location.assign(href);
  }

  async function submitRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || sendingRef.current) return;
    sendingRef.current = true;
    setSending(true);
    setError(null);
    setSuccess(null);
    const form = event.currentTarget;
    const values = new FormData(form);
    idempotencyKeyRef.current ??= crypto.randomUUID();
    operationIdRef.current ??= crypto.randomUUID();
    try {
      const response = await fetch("/api/mobility/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKeyRef.current,
        },
        body: JSON.stringify({
          providerId: selected.providerId,
          productId: selected.id,
          vertical: selected.vertical,
          contactName: values.get("name"),
          contactEmail: values.get("email"),
          contactPhone: values.get("phone"),
          customerNote: values.get("note"),
          captchaToken,
          website: values.get("website"),
          operationId: operationIdRef.current,
          placement: "mobility_catalog",
        }),
      });
      const payload = await response.json().catch(() => ({})) as { message?: string };
      if (!response.ok) {
        setError(response.status === 429
          ? "Слишком много попыток. Подождите немного и повторите отправку."
          : "Не удалось отправить заявку. Проверьте данные и попробуйте ещё раз.");
        return;
      }
      form.reset();
      idempotencyKeyRef.current = null;
      operationIdRef.current = null;
      setSelected(null);
      setSuccess(payload.message || "Заявка получена. Организатор подтвердит доступность и условия отдельно.");
    } catch {
      setError("Связь прервалась. Повторите отправку — дубликат заявки не создастся.");
    } finally {
      setCaptchaToken("");
      setCaptchaResetSignal((signal) => signal + 1);
      sendingRef.current = false;
      setSending(false);
    }
  }

  if (!vertical || !marketId) {
    return (
      <section className="rounded-3xl border border-border-subtle bg-surface-elevated p-6 shadow-card">
        <h2 className="text-xl font-semibold text-foreground">Выберите страну и услугу</h2>
        <p className="mt-2 text-sm text-muted">Цены и условия зависят от страны. Вы всегда увидите, кто подтверждает заявку.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link className={buttonVariants({ variant: "primary" })} href="/mobility?marketId=ar&vertical=rental">Аргентина · авто</Link>
          <Link className={buttonVariants({ variant: "primary" })} href="/mobility?marketId=ar&vertical=transfer">Аргентина · трансферы</Link>
          <Link className={buttonVariants({ variant: "secondary" })} href="/mobility?marketId=uy&vertical=rental">Уругвай · авто</Link>
          <Link className={buttonVariants({ variant: "secondary" })} href="/mobility?marketId=uy&vertical=transfer">Уругвай · трансферы</Link>
        </div>
      </section>
    );
  }

  if (loading) return <InlineFeedback variant="loading" title="Загружаем доступные варианты" description="Проверяем собственные предложения и партнёрские способы отдельно." />;
  if (error && !catalog) return <InlineFeedback variant="error" title="Варианты временно недоступны" description={error} action={{ label: "Обновить страницу", onClick: () => window.location.reload() }} />;
  if (!catalog) return null;

  return (
    <div className="space-y-8">
      {success ? <InlineFeedback variant="success" title="Заявка отправлена" description={success} /> : null}
      {error ? <InlineFeedback variant="error" title="Проверьте заявку" description={error} /> : null}

      <section>
        <h2 className="text-xl font-semibold text-foreground">Как оформить</h2>
        <p className="mt-1 text-sm text-muted">Собственные предложения оформляются заявкой. Партнёрские варианты открываются на сайте соответствующего сервиса.</p>
        {providers.length === 0 ? (
          <div className="mt-4"><EmptyState icon={Route} title="Для этой страны пока нет доступных способов" description="Выберите другую страну или вернитесь позже." /></div>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {providers.map((provider) => {
              const action = resolveMobilityAction(provider);
              return (
                <article key={provider.providerId} className="rounded-2xl border border-border-subtle bg-surface-elevated p-5 shadow-card">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-foreground">{provider.displayName}</h3>
                      <p className="mt-1 text-sm text-muted">{providerDescription(provider.capabilityMode)}</p>
                    </div>
                    <span className="rounded-full bg-surface-muted px-3 py-1 text-xs text-muted">{COUNTRY_LABELS[provider.countryCode] ?? provider.countryCode}</span>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-muted">Доступность и итоговую цену подтверждает выбранный поставщик. На этой странице списаний нет.</p>
                  {action.kind === "affiliate_handoff" ? (
                    <Button
                      className="mt-4"
                      loading={handoffProviderId === provider.providerId}
                      loadingLabel="Открываем сайт партнёра"
                      disabled={handoffProviderId !== null}
                      onClick={() => void handoff(provider.providerId, action.href)}
                    >
                      Перейти к партнёру <ExternalLink className="h-4 w-4" aria-hidden />
                    </Button>
                  ) : null}
                  {action.kind === "native_request" ? <p className="mt-4 text-sm font-medium text-sky">Выберите собственное предложение ниже</p> : null}
                  {action.kind === "unavailable" ? <p className="mt-4 text-sm text-muted">Сейчас заявки через этот способ не принимаются.</p> : null}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center gap-2"><CarFront className="h-5 w-5 text-sky" aria-hidden /><h2 className="text-xl font-semibold text-foreground">Собственные предложения</h2></div>
        {catalog.offers.length === 0 ? (
          <div className="mt-4"><EmptyState icon={CarFront} title="Проверенных предложений пока нет" description="Партнёрские варианты выше продолжают работать независимо." /></div>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {catalog.offers.map((offer) => (
              <article key={offer.id} className="rounded-2xl border border-sky/20 bg-surface-elevated p-5 shadow-card">
                <h3 className="font-semibold text-foreground">{offer.title}</h3>
                <p className="mt-2 text-sm text-muted">{offer.originLabel} → {offer.destinationLabel}</p>
                <p className="mt-3 text-lg font-semibold text-foreground">от {money(offer.priceMinor, offer.displayCurrency)}</p>
                <ul className="mt-3 space-y-1 text-xs text-muted">
                  <li>{offer.seatCapacity} пассажирских мест</li>
                  <li>{offer.luggageCapacity} мест для багажа</li>
                  <li>Доступность и итоговые условия подтверждаются вручную</li>
                </ul>
                <Button className="mt-4" onClick={() => selectOffer(offer)}>Отправить заявку</Button>
              </article>
            ))}
          </div>
        )}
      </section>

      {selected ? (
        <form
          onSubmit={submitRequest}
          onChange={() => {
            if (sendingRef.current) return;
            idempotencyKeyRef.current = null;
            operationIdRef.current = null;
          }}
          className="rounded-3xl border border-sky/25 bg-sky/[0.05] p-5 shadow-card sm:p-6"
        >
          <h2 className="text-lg font-semibold text-foreground">Заявка: {selected.title}</h2>
          <p className="mt-1 text-sm text-muted">Это запрос, а не мгновенная бронь. Организатор отдельно подтвердит доступность, цену и порядок оплаты.</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <FormField id="mobility-request-name" label="Имя" required>
              <Input name="name" required minLength={2} maxLength={120} autoComplete="name" disabled={sending} />
            </FormField>
            <FormField id="mobility-request-email" label="Email" required hint="На него придёт ответ по заявке.">
              <Input name="email" required type="email" maxLength={320} autoComplete="email" disabled={sending} />
            </FormField>
            <FormField id="mobility-request-phone" label="Телефон" optional>
              <Input name="phone" type="tel" maxLength={40} autoComplete="tel" disabled={sending} />
            </FormField>
            <FormField id="mobility-request-note" label="Пожелания" optional hint="Например время прилёта, детское кресло или количество багажа.">
              <Textarea name="note" maxLength={2000} rows={3} disabled={sending} />
            </FormField>
          </div>
          <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
          <div className="mt-4">
            <TurnstileField formId="native_booking" onToken={setCaptchaToken} resetSignal={captchaResetSignal} />
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button type="submit" loading={sending} loadingLabel="Отправляем заявку">Отправить заявку</Button>
            <Button type="button" variant="secondary" disabled={sending} onClick={closeRequest}>Отмена</Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
