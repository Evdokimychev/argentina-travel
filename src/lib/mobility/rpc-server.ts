import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type RpcError = { message: string; code?: string };
type RpcResult = { data: unknown; error: RpcError | null };
type MobilityRpcClient = {
  rpc(name: string, args?: Record<string, unknown>): PromiseLike<RpcResult>;
};

export type MobilityRpcFailure = {
  ok: false;
  code: "VERSION_CONFLICT" | "NOT_FOUND" | "FORBIDDEN" | "INVALID" | "UNAVAILABLE";
  message: string;
};

export type MobilityRpcSuccess<T> = { ok: true; data: T };

function mapFailure(error: RpcError): MobilityRpcFailure {
  if (error.code === "40001" || error.message.includes("VERSION_CONFLICT")) {
    return { ok: false, code: "VERSION_CONFLICT", message: "Данные уже изменились. Обновите страницу и повторите действие." };
  }
  if (error.code === "P0002" || error.message.includes("NOT_FOUND")) {
    return { ok: false, code: "NOT_FOUND", message: "Запись не найдена." };
  }
  if (error.code === "42501" || error.message.includes("OWNER_MISMATCH")) {
    return { ok: false, code: "FORBIDDEN", message: "У вас нет доступа к этой записи." };
  }
  if (error.code === "22023" || error.code === "23514" || error.code === "23505") {
    return { ok: false, code: "INVALID", message: "Действие недоступно для текущего состояния или данных." };
  }
  return { ok: false, code: "UNAVAILABLE", message: "Сервис временно недоступен. Повторите позже." };
}

export async function callMobilityRpc<T>(
  name: string,
  args: Record<string, unknown>,
): Promise<MobilityRpcSuccess<T> | MobilityRpcFailure> {
  const client = createSupabaseAdminClient() as unknown as MobilityRpcClient;
  const { data, error } = await client.rpc(name, args);
  if (error) return mapFailure(error);
  return { ok: true, data: data as T };
}
