import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { parseAnalyticsPeriod } from "@/lib/admin/analytics-period";
import { listPaymentTransactions } from "@/lib/payments/transaction-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  PaymentTransactionStatus,
  PaymentTransactionType,
} from "@/types/payment-platform";
import type { PaymentProviderId } from "@/types/payment-webhook";

function parseType(value: string | null): PaymentTransactionType | "all" {
  if (value === "charge" || value === "refund" || value === "payout") return value;
  return "all";
}

function parseStatus(value: string | null): PaymentTransactionStatus | "all" {
  if (
    value === "pending" ||
    value === "processing" ||
    value === "completed" ||
    value === "failed" ||
    value === "cancelled" ||
    value === "rejected"
  ) {
    return value;
  }
  return "all";
}

function parseProvider(value: string | null): PaymentProviderId | "all" {
  if (value === "mercadopago" || value === "stripe" || value === "manual") return value;
  return "all";
}

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "operations.bookings");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const period = parseAnalyticsPeriod(url.searchParams.get("period"));
  const type = parseType(url.searchParams.get("type"));
  const status = parseStatus(url.searchParams.get("status"));
  const provider = parseProvider(url.searchParams.get("provider"));
  const bookingId = url.searchParams.get("bookingId");

  const supabase = createSupabaseAdminClient();
  const transactions = await listPaymentTransactions(supabase, {
    period,
    type,
    status,
    provider,
    bookingId: bookingId ?? undefined,
  });

  return NextResponse.json({ transactions, period, type, status, provider });
}
