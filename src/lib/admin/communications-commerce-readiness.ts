export type ReadinessStatus = "ready" | "partial" | "not_configured";

export type ReadinessCheck = {
  key: string;
  label: string;
  ready: boolean;
};

export type ProviderReadiness = {
  id: "email" | "stripe" | "mercado_pago";
  title: string;
  status: ReadinessStatus;
  checks: ReadinessCheck[];
};

export type CommunicationsCommerceReadiness = {
  providers: ProviderReadiness[];
  paymentSandboxMode: boolean;
};

function hasValue(value: string | undefined): boolean {
  return Boolean(value?.trim());
}

function isEnabled(value: string | undefined): boolean {
  return ["1", "true", "yes", "on"].includes(value?.trim().toLowerCase() ?? "");
}

function isExplicitlyDisabled(value: string | undefined): boolean {
  return ["0", "false", "no", "off"].includes(value?.trim().toLowerCase() ?? "");
}

function getStatus(checks: ReadinessCheck[]): ReadinessStatus {
  const readyCount = checks.filter((check) => check.ready).length;

  if (readyCount === checks.length) return "ready";
  if (readyCount > 0) return "partial";
  return "not_configured";
}

function createProvider(
  id: ProviderReadiness["id"],
  title: string,
  checks: ReadinessCheck[],
): ProviderReadiness {
  return {
    id,
    title,
    status: getStatus(checks),
    checks,
  };
}

export function getCommunicationsCommerceReadiness(
  environment: Readonly<Record<string, string | undefined>>,
): CommunicationsCommerceReadiness {
  const emailChecks: ReadinessCheck[] = [
    {
      key: "provider",
      label: "Сервис отправки писем подключён",
      ready: hasValue(environment.RESEND_API_KEY),
    },
    {
      key: "sender",
      label: "Адрес отправителя задан",
      ready: hasValue(environment.LEADS_NOTIFY_FROM),
    },
    {
      key: "recipient",
      label: "Адрес для уведомлений администратора задан",
      ready: hasValue(environment.LEADS_NOTIFY_EMAIL),
    },
  ];

  const stripeChecks: ReadinessCheck[] = [
    {
      key: "enabled",
      label: "Платёжный сценарий доступен на сервере и клиенте",
      ready:
        hasValue(environment.STRIPE_SECRET_KEY) &&
        hasValue(environment.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) &&
        !isExplicitlyDisabled(environment.STRIPE_ENABLED) &&
        !isExplicitlyDisabled(environment.NEXT_PUBLIC_STRIPE_ENABLED),
    },
    {
      key: "server",
      label: "Серверное подключение подготовлено",
      ready: hasValue(environment.STRIPE_SECRET_KEY),
    },
    {
      key: "client",
      label: "Публичная часть подключения подготовлена",
      ready: hasValue(environment.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
    },
    {
      key: "webhook",
      label: "Проверка входящих уведомлений подготовлена",
      ready: hasValue(environment.STRIPE_WEBHOOK_SECRET),
    },
  ];

  const mercadoPagoChecks: ReadinessCheck[] = [
    {
      key: "server",
      label: "Серверное подключение подготовлено",
      ready: hasValue(environment.MERCADOPAGO_ACCESS_TOKEN),
    },
    {
      key: "client",
      label: "Публичная часть подключения подготовлена",
      ready:
        hasValue(environment.MERCADOPAGO_PUBLIC_KEY) ||
        hasValue(environment.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY),
    },
    {
      key: "webhook",
      label: "Проверка входящих уведомлений подготовлена",
      ready: hasValue(environment.MERCADOPAGO_WEBHOOK_SECRET),
    },
  ];

  return {
    providers: [
      createProvider("email", "Электронные письма", emailChecks),
      createProvider("stripe", "Stripe", stripeChecks),
      createProvider("mercado_pago", "Mercado Pago", mercadoPagoChecks),
    ],
    paymentSandboxMode: isEnabled(environment.PAYMENT_SANDBOX_MODE),
  };
}
