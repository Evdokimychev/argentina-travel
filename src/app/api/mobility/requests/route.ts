import { NextResponse } from "next/server";
import { isUuid } from "@/lib/admin/user-identity-management";
import { verifyGuestFormProtection } from "@/lib/forms/captcha-server";
import { mobilityModuleBlockedResponse, resolveMobilityModuleAccess } from "@/lib/mobility/module-policy-server";
import { callMobilityRpc } from "@/lib/mobility/rpc-server";
import { checkRateLimit, getClientIp, rateLimitErrorResponse } from "@/lib/rate-limit";
import { isMobilityVertical } from "@/types/mobility";

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > 32_768) {
    return NextResponse.json({ error: "Запрос слишком большой" }, { status: 413 });
  }
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const vertical = body?.vertical;
  if (!body || !isMobilityVertical(vertical)) return NextResponse.json({ error: "Некорректный тип" }, { status: 400 });
  const access = await resolveMobilityModuleAccess(vertical);
  if (!access.allowed) return mobilityModuleBlockedResponse(access);
  if (!access.allowNativeOffers) {
    return NextResponse.json({ error: "Собственные заявки для этого раздела пока не принимаются.", code: "NATIVE_REQUEST_DISABLED" }, { status: 409 });
  }
  const limit = await checkRateLimit(`mobility-request:${getClientIp(request)}`, 8, 60 * 60_000);
  if (!limit.ok) return rateLimitErrorResponse(limit.retryAfterSec, "Слишком много заявок. Попробуйте позже.");
  const protection = await verifyGuestFormProtection({
    request,
    formId: "native_booking",
    captchaToken: typeof body.captchaToken === "string" ? body.captchaToken : null,
    honeypot: typeof body.website === "string" ? body.website : null,
  });
  if (!protection.ok) {
    return NextResponse.json(
      { error: protection.kind === "configuration" ? "Защита формы временно недоступна." : "Не удалось проверить форму." },
      { status: protection.kind === "configuration" ? 503 : 400 },
    );
  }
  const idempotencyKey = request.headers.get("idempotency-key")?.trim() ?? "";
  const contactName = typeof body.contactName === "string" ? body.contactName.trim() : "";
  const contactEmail = typeof body.contactEmail === "string" ? body.contactEmail.trim().toLowerCase() : "";
  const contactPhone = typeof body.contactPhone === "string" ? body.contactPhone.trim() : "";
  const customerNote = typeof body.customerNote === "string" ? body.customerNote.trim() : "";
  const operationId = typeof body.operationId === "string" ? body.operationId : crypto.randomUUID();
  if (
    idempotencyKey.length < 16 || idempotencyKey.length > 200
    || contactName.length < 2 || contactName.length > 120
    || contactEmail.length > 320 || !/^\S+@\S+\.\S+$/.test(contactEmail)
    || contactPhone.length > 40 || customerNote.length > 2000
    || !isUuid(String(body.providerId)) || !isUuid(String(body.productId)) || !isUuid(operationId)
  ) {
    return NextResponse.json({ error: "Проверьте контактные данные и повторите отправку" }, { status: 400 });
  }
  const result = await callMobilityRpc<Record<string, unknown>>("mobility_create_request", {
    p_provider_id: body.providerId,
    p_vertical: vertical,
    p_product_id: body.productId,
    p_idempotency_key: idempotencyKey,
    p_requester_user_id: null,
    p_contact_name: contactName,
    p_contact_email: contactEmail,
    p_contact_phone: contactPhone || null,
    p_pickup_details: typeof body.pickupDetails === "object" && body.pickupDetails !== null ? body.pickupDetails : {},
    p_customer_note: customerNote || null,
    p_operation_id: operationId,
    p_placement: typeof body.placement === "string" ? body.placement : "mobility_catalog",
  });
  if (!result.ok) {
    const status = result.code === "INVALID" ? 409 : result.code === "FORBIDDEN" ? 403 : 503;
    return NextResponse.json({ error: result.code === "INVALID" ? "Заявка уже была отправлена с другими данными или предложение изменилось." : "Не удалось сохранить заявку. Повторите позже.", code: result.code }, { status });
  }
  return NextResponse.json(
    { request: result.data, message: "Заявка получена. Подтверждение и условия будут отправлены отдельно." },
    { status: 201, headers: { "Cache-Control": "private, no-store, max-age=0" } },
  );
}
