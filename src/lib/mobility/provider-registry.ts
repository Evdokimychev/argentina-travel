import type { MobilityProviderCapability, MobilityVertical } from "@/types/mobility";

/**
 * Provider behavior is data-driven. A new provider registry row can be rendered
 * without a provider-specific branch in the source selector.
 */
export function selectMobilityCapabilities(
  providers: MobilityProviderCapability[],
  vertical: MobilityVertical,
  marketId: string,
): MobilityProviderCapability[] {
  return providers.filter((provider) => provider.marketId === marketId && provider.vertical === vertical);
}

export function resolveMobilityAction(provider: MobilityProviderCapability):
  | { kind: "native_request" }
  | { kind: "affiliate_handoff"; href: string }
  | { kind: "unavailable" } {
  if (provider.capabilityMode === "native_request") return { kind: "native_request" };
  if (provider.capabilityMode === "affiliate_handoff" && provider.handoffPath?.startsWith("/")) {
    return { kind: "affiliate_handoff", href: provider.handoffPath };
  }
  return { kind: "unavailable" };
}
