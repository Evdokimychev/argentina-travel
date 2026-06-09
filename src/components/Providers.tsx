"use client";

import { LocaleCurrencyProvider } from "@/context/LocaleCurrencyContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <LocaleCurrencyProvider>{children}</LocaleCurrencyProvider>;
}
