import "next/navigation";
import type { ReadonlyURLSearchParams } from "next/navigation";

declare module "next/navigation" {
  export function usePathname(): string;
  export function useSearchParams(): ReadonlyURLSearchParams;
}
