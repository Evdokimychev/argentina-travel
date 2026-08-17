export const READINESS_TARGET = 90;

const STAGING_EVIDENCE_KEYS = [
  "browser",
  "request",
  "database",
  "roleVisibility",
  "cleanup",
];

function clamp(value) {
  return Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
}

function contribution(id, label, weight, ratio, reason) {
  const normalized = clamp(ratio * 100) / 100;
  return {
    id,
    label,
    weight,
    earned: Math.round(weight * normalized * 10) / 10,
    ratio: Math.round(normalized * 1000) / 1000,
    reason,
  };
}

function statusRatio(report) {
  if (!report) return 0;
  if (report.status === "passed" || report.status === "ok" || report.ok === true || report.pass === true) {
    return 1;
  }
  return 0;
}

function summaryRatio(summary) {
  if (!summary) return 0;
  const ok = Number(summary.ok ?? summary.passed ?? 0);
  const warn = Number(summary.warn ?? 0);
  const fail = Number(summary.fail ?? summary.failed ?? 0);
  const skip = Number(summary.skip ?? summary.skipped ?? 0);
  const total = ok + warn + fail + skip;
  if (!total) return 0;
  return clamp(((ok + warn * 0.5) / total) * 100) / 100;
}

function releaseGroupRatio(report, group) {
  if (!report || report.requestedGroup !== "all" || report.status !== "passed") return 0;
  const checks = Array.isArray(report?.checks) ? report.checks.filter((check) => check.group === group) : [];
  if (!checks.length) return 0;
  return checks.filter((check) => check.status === "passed").length / checks.length;
}

function checkRatio(report, ids) {
  const checks = Array.isArray(report?.checks) ? report.checks : [];
  if (!ids.length) return 0;
  const passed = ids.filter((id) => checks.some((check) => check.id === id && check.status === "ok")).length;
  return passed / ids.length;
}

function publicEditorialRatio(report) {
  if (!report || report.status !== "passed") return 0;
  if (Array.isArray(report.errors) && report.errors.length > 0) return 0;
  return 1;
}

function seoRatio(report) {
  if (!report) return 0;
  const critical = report.sitemap?.criticalIssues?.length ?? 0;
  const crawled = report.sitemap?.crawledUrlCount ?? report.sitemap?.urlCount ?? 0;
  if (!crawled) return 0;
  if (critical > 0) return Math.max(0, 1 - critical / crawled);
  return report.ok === true ? 1 : 0;
}

function lighthouseRatio(report) {
  if (!report) return 0;
  const results = Array.isArray(report.results) ? report.results : [];
  const performance = Math.min(1, Number(report.medianPerformance ?? 0) / 90);
  const accessibility = Math.min(1, Number(report.medianAccessibility ?? 0) / 95);
  const lcpPass = results.length
    ? results.filter((result) => Number(result.lcpMs ?? Number.POSITIVE_INFINITY) <= 2500).length / results.length
    : 0;
  const clsPass = results.length
    ? results.filter((result) => Number(result.cls ?? Number.POSITIVE_INFINITY) <= 0.1).length / results.length
    : 0;
  const ratio = performance * 0.4 + accessibility * 0.2 + lcpPass * 0.25 + clsPass * 0.15;
  return report.evidenceEnvironment === "local-production" ? Math.min(ratio, 0.89) : ratio;
}

function uxRatio(report) {
  const summary = report?.summary;
  if (!summary) return 0;
  const total = Number(summary.total ?? 0);
  if (!total) return 0;
  const passed = Number(summary.passed ?? 0);
  const failed = Number(summary.failed ?? 0);
  const skipped = Number(summary.skipped ?? 0);
  if (failed > 0 || skipped > 0) return 0;
  return passed === total ? 1 : passed / total;
}

function productionRatio(evidence) {
  const readiness = evidence.productionReadiness;
  const publish = evidence.publish;
  const release = evidence.release;
  const readinessScore = readiness?.ok === true ? 1 : summaryRatio(readiness?.summary);
  const publishScore = publish?.ok === true ? 1 : summaryRatio(publish?.summary);
  const releaseScore =
    release?.status === "passed" && release?.requestedGroup === "all" ? 1 : 0;
  return readinessScore * 0.4 + publishScore * 0.35 + releaseScore * 0.25;
}

function stagingJourneyRatio(report, ids) {
  const journeys = Array.isArray(report?.journeys) ? report.journeys : [];
  if (!ids.length || !journeys.length) return 0;
  let passed = 0;
  for (const id of ids) {
    const journey = journeys.find((item) => item.id === id);
    const evidence = journey?.evidence ?? {};
    const completeEvidence = STAGING_EVIDENCE_KEYS.every((key) => evidence[key] === true);
    if (journey?.status === "passed" && completeEvidence) passed += 1;
  }
  return passed / ids.length;
}

const LIVE_COMMERCIAL_CLAIM_KEYS = new Set([
  "events",
  "dashboard",
  "conversionProof",
  "leadCapture",
  "deduplication",
  "revenueAttribution",
]);

function artifactRatio(report, required = []) {
  if (!report || statusRatio(report) === 0) return 0;
  if (!required.length) return 1;
  // Local contracts must never satisfy live commercial claims — even if JSON is hand-edited.
  if (report.evidenceLevel === "local-contract") {
    if (required.some((key) => LIVE_COMMERCIAL_CLAIM_KEYS.has(key))) return 0;
  }
  return required.filter((key) => report[key] === true).length / required.length;
}

function analyticsRatio(report) {
  if (!report) return 0;
  const automated = summaryRatio(report.summary);
  const live = checkRatio(report, [
    "live:gtm",
    "live:gtm-consent-default",
    "live:datalayer-init",
    "live:google-verification",
  ]);
  return automated * 0.5 + live * 0.5;
}

function role(id, label, items, { applicable = true, deferredReason = null } = {}) {
  if (!applicable) {
    return {
      id,
      label,
      score: 100,
      target: READINESS_TARGET,
      ready: true,
      applicable: false,
      deferredReason,
      evidence: [],
      blockers: [],
    };
  }
  const rawScore = Math.round(items.reduce((sum, item) => sum + item.earned, 0) * 10) / 10;
  const hasWeakEvidence = items.some((item) => item.ratio < READINESS_TARGET / 100);
  const score = hasWeakEvidence ? Math.min(rawScore, READINESS_TARGET - 0.1) : rawScore;
  return {
    id,
    label,
    score,
    target: READINESS_TARGET,
    ready: score > READINESS_TARGET,
    applicable: true,
    deferredReason: null,
    evidence: items,
    blockers: items.filter((item) => item.ratio < 0.9).map((item) => `${item.label}: ${item.reason}`),
  };
}

/**
 * Current production commercial modes (mirrors src/lib/commerce/business-model.ts).
 * Keep in sync — intentional own_payment=false must not block overall readiness.
 */
const PRODUCTION_COMMERCIAL_MODES = Object.freeze({
  own_lead: true,
  partner_redirect: true,
  affiliate: true,
  own_booking: true,
  own_payment: false,
});

export function evaluateReadiness90(evidence) {
  const portal = role("portal", "Туристический портал и путеводитель", [
    contribution("editorial", "Публичный редакционный gate", 25, publicEditorialRatio(evidence.publicEditorial), "нужен passed-отчёт без ошибок"),
    contribution("seo", "SEO crawl", 20, seoRatio(evidence.seo), "нужен полный crawl без critical"),
    contribution("performance", "Производительность", 25, lighthouseRatio(evidence.lighthouse), "нужны median performance ≥90, a11y ≥95, LCP ≤2.5s и CLS ≤0.1"),
    contribution("ux", "UX и responsive", 15, uxRatio(evidence.ux), "нужны 0 failed и 0 skipped"),
    contribution("production", "Production health и release evidence", 15, productionRatio(evidence), "нужны согласованные production, publish и release отчёты"),
  ]);

  const affiliate = role("affiliate", "Партнёрский каталог туров и экскурсий", [
    contribution("catalog", "Качество публичного каталога", 15, portal.score / 100, "зависит от качества портала"),
    contribution("partner-attribution", "Партнёрская атрибуция", 25, artifactRatio(evidence.partnerAttribution, ["testClick", "partnerDashboardProof", "reconciliation"]), "нужны тестовый клик, доказательство в кабинете и сверка"),
    contribution("journeys", "Staging journeys J01–J03", 25, stagingJourneyRatio(evidence.staging, ["J01", "J02", "J03"]), "нужны browser/API/DB/roles/cleanup evidence"),
    contribution("funnel", "Коммерческий funnel", 20, artifactRatio(evidence.commercialFunnel, ["events", "dashboard", "conversionProof"]), "нужны события, dashboard и подтверждённая конверсия"),
    contribution("commerce-gate", "Commerce release gate", 15, releaseGroupRatio(evidence.release, "commerce"), "нужен зелёный commerce gate на том же SHA"),
  ]);

  const leads = role("leads", "Сбор заявок и консультаций", [
    contribution("journeys", "Staging journeys J04–J08", 30, stagingJourneyRatio(evidence.staging, ["J04", "J05", "J06", "J07", "J08"]), "нужны реальные auth/lead journeys"),
    contribution("funnel", "Lead funnel", 25, artifactRatio(evidence.commercialFunnel, ["leadCapture", "deduplication", "conversionProof"]), "нужны capture, deduplication и доказанная доставка"),
    contribution("analytics", "Аналитика лидов", 20, analyticsRatio(evidence.analytics), "нужны live GTM/consent/dataLayer/verification"),
    contribution("outbox", "Email/outbox", 15, artifactRatio(evidence.operations, ["emailOutbox", "retryProof", "alerting"]), "нужны outbox, retry и alerting"),
    contribution("production", "Production health", 10, productionRatio(evidence), "нужен воспроизводимый release evidence"),
  ]);

  const booking = role("booking", "Собственное бронирование и CRM", [
    contribution("journeys", "Staging journeys J16–J21", 55, stagingJourneyRatio(evidence.staging, ["J16", "J17", "J18", "J19", "J20", "J21"]), "нужны booking/availability/CRM journeys с cleanup"),
    contribution("commerce-gate", "Commerce release gate", 15, releaseGroupRatio(evidence.release, "commerce"), "нужен зелёный commerce gate"),
    contribution("rls", "RLS и grants", 10, statusRatio(evidence.rls), "нужен live RLS/grants audit без critical"),
    contribution("operations", "Мониторинг бронирований", 10, artifactRatio(evidence.operations, ["bookingSlo", "alerting", "incidentRunbook"]), "нужны SLO, alerting и runbook"),
    contribution("production", "Production health", 10, productionRatio(evidence), "нужен воспроизводимый release evidence"),
  ]);

  const payments = role(
    "payments",
    "Онлайн-оплата и возвраты",
    [
      contribution("journey", "Staging journey J22", 40, stagingJourneyRatio(evidence.staging, ["J22"]), "нужен sandbox payment journey с signed webhook"),
      contribution("provider", "Выбранный платёжный провайдер", 30, artifactRatio(evidence.paymentProvider, ["ownerApproval", "sandboxPayment", "signedWebhook", "reconciliation"]), "финальный этап: Т-Банк или Mercado Pago после решения владельца"),
      contribution("refund", "Возвраты и споры", 15, artifactRatio(evidence.paymentProvider, ["refundProof", "disputeProcess", "idempotency"]), "нужны refund, dispute и idempotency evidence"),
      contribution("compliance", "Чеки, налоги и договоры", 15, artifactRatio(evidence.paymentProvider, ["legalReview", "receiptPolicy", "merchantContract"]), "нужны юридическая проверка, чеки и договор эквайринга"),
    ],
    {
      applicable: PRODUCTION_COMMERCIAL_MODES.own_payment === true,
      deferredReason:
        "OWN_PAYMENT intentionally disabled in current production business model; partner handoff + own leads are the active modes",
    },
  );

  const analytics = role("analytics", "Маркетинг и измерение выручки", [
    contribution("live-analytics", "Live analytics readiness", 50, analyticsRatio(evidence.analytics), "нужны GTM, Consent Mode, dataLayer и verification"),
    contribution("funnel", "Funnel dashboard", 25, artifactRatio(evidence.commercialFunnel, ["events", "dashboard", "revenueAttribution"]), "нужны события, dashboard и атрибуция выручки"),
    contribution("seo-verification", "Search Console", 10, checkRatio(evidence.analytics, ["live:google-verification", "live:robots-sitemap"]), "нужны verification и sitemap"),
    contribution("partner-revenue", "Сверка партнёрской выручки", 15, artifactRatio(evidence.partnerAttribution, ["partnerDashboardProof", "reconciliation"]), "нужна регулярная сверка с кабинетами партнёров"),
  ]);

  const roles = [portal, affiliate, leads, booking, payments, analytics];
  const scoredRoles = roles.filter((item) => item.applicable !== false);
  const overall =
    Math.round((scoredRoles.reduce((sum, item) => sum + item.score, 0) / scoredRoles.length) * 10) / 10;
  return {
    schemaVersion: 2,
    target: READINESS_TARGET,
    overall,
    ready: overall > READINESS_TARGET && scoredRoles.every((item) => item.ready),
    commercialModes: PRODUCTION_COMMERCIAL_MODES,
    roles,
    blockers: scoredRoles
      .filter((item) => !item.ready)
      .map((item) => `${item.label}: ${item.score}%`),
  };
}
