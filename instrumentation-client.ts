import { captureRouterTransitionStart, initSentry } from "@/lib/monitoring/sentry";

void initSentry();

export { captureRouterTransitionStart as onRouterTransitionStart };
