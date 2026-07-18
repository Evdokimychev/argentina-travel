export function isLocalLighthouseBase(baseUrl) {
  return /^https?:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?(?:\/|$)/i.test(baseUrl);
}

export function medianNumber(values) {
  if (!values.length) return Number.POSITIVE_INFINITY;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

export function lighthouseBudgetForPath(baseBudget, samplePath, { local }) {
  const partnerTourDetail = samplePath.startsWith("/tours/");
  const map = samplePath === "/mapa-argentina";

  return {
    ...baseBudget,
    accessibility: local && map ? Math.min(baseBudget.accessibility, 85) : baseBudget.accessibility,
    lcpMs: local && partnerTourDetail ? Math.max(baseBudget.lcpMs, 10_000) : baseBudget.lcpMs,
    tbtMs: local && map ? Math.max(baseBudget.tbtMs, 3_500) : baseBudget.tbtMs,
    transferBytes: partnerTourDetail
      ? Math.max(baseBudget.contentTransferBytes, 1_800_000)
      : samplePath === "/"
        ? baseBudget.homeTransferBytes
        : baseBudget.contentTransferBytes,
  };
}

export function evaluateLighthouseMetrics(metrics, budget, { seoBlocking }) {
  return (
    metrics.performance >= budget.performance &&
    metrics.accessibility >= budget.accessibility &&
    (!seoBlocking || metrics.seo >= budget.seo) &&
    metrics.lcpMs <= budget.lcpMs &&
    metrics.cls <= budget.cls &&
    metrics.tbtMs <= budget.tbtMs &&
    metrics.transferBytes <= budget.transferBytes &&
    metrics.scriptTransferBytes <= budget.scriptTransferBytes &&
    (metrics.inpMs == null || metrics.inpMs <= budget.inpMs)
  );
}

export function summarizeLighthousePathRuns({
  path,
  runs,
  requiredRuns,
  budget,
  seoBlocking,
}) {
  const complete = runs.filter((run) => !run.error);
  const metrics = {
    performance: medianNumber(complete.map((run) => run.performance)),
    accessibility: medianNumber(complete.map((run) => run.accessibility)),
    seo: seoBlocking ? medianNumber(complete.map((run) => run.seo)) : null,
    lcpMs: medianNumber(complete.map((run) => run.lcpMs)),
    cls: medianNumber(complete.map((run) => run.cls)),
    tbtMs: medianNumber(complete.map((run) => run.tbtMs)),
    transferBytes: medianNumber(complete.map((run) => run.transferBytes)),
    scriptTransferBytes: medianNumber(complete.map((run) => run.scriptTransferBytes)),
    inpMs: complete.some((run) => run.inpMs != null)
      ? medianNumber(complete.filter((run) => run.inpMs != null).map((run) => run.inpMs))
      : null,
  };
  const evidenceComplete = complete.length === requiredRuns;
  return {
    path,
    runsCompleted: complete.length,
    runsRequired: requiredRuns,
    ...metrics,
    budget,
    pass:
      evidenceComplete &&
      evaluateLighthouseMetrics(metrics, budget, { seoBlocking }),
  };
}
