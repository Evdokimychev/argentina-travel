"use client";

import { LocaleCurrencyProvider } from "@/context/LocaleCurrencyContext";
import { AuthProvider } from "@/context/AuthContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LocaleCurrencyProvider>
      <AuthProvider>{children}</AuthProvider>
    </LocaleCurrencyProvider>
  );
}
