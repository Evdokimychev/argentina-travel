import type { LocaleCode } from "@/types/locale";

/**
 * Locales exposed in the public language selector.
 * Incomplete ES/EN stay reachable via URL rewrite + noindex, but must not appear
 * as a published product surface until CMS translations are ready.
 */
export const PUBLISHED_PUBLIC_LOCALES: readonly LocaleCode[] = ["ru"];
