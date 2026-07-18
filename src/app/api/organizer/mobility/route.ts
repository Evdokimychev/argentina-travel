import { NextResponse } from "next/server";
import { authorizeOrganizerMobility } from "@/lib/mobility/organizer-auth-server";
import { callMobilityRpc } from "@/lib/mobility/rpc-server";
import type { MobilityInventory } from "@/types/mobility";
import { isMobilityVertical } from "@/types/mobility";

const MARKET_PATTERN = /^[a-z0-9][a-z0-9_-]{1,39}$/;
const COUNTRY_PATTERN = /^[A-Z]{2}$/;
const CURRENCY_PATTERN = /^[A-Z]{3}$/;

function statusForFailure(code: string): number {
  return code === "VERSION_CONFLICT" ? 409 : code === "FORBIDDEN" ? 403 : code === "NOT_FOUND" ? 404 : code === "INVALID" ? 400 : 503;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const vertical = url.searchParams.get("vertical");
  if (!isMobilityVertical(vertical)) {
    return NextResponse.json({ error: "Укажите тип: rental или transfer" }, { status: 400 });
  }
  const auth = await authorizeOrganizerMobility(vertical);
  if (!auth.ok) return auth.response;
  const marketId = url.searchParams.get("marketId");
  if (marketId && !MARKET_PATTERN.test(marketId)) {
    return NextResponse.json({ error: "Некорректный рынок" }, { status: 400 });
  }
  const result = await callMobilityRpc<MobilityInventory>("mobility_list_inventory", {
    p_actor_user_id: auth.user.id,
    p_actor_scope: "organizer",
    p_vertical: vertical,
    p_market_id: marketId,
  });
  if (!result.ok) return NextResponse.json({ error: result.message, code: result.code }, { status: statusForFailure(result.code) });
  return NextResponse.json({ inventory: result.data, vertical, marketId });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const vertical = body?.vertical;
  if (!body || !isMobilityVertical(vertical)) {
    return NextResponse.json({ error: "Некорректный тип предложения" }, { status: 400 });
  }
  const auth = await authorizeOrganizerMobility(vertical);
  if (!auth.ok) return auth.response;
  const action = body.action;
  const marketId = typeof body.marketId === "string" ? body.marketId.trim().toLowerCase() : "";
  const countryCode = typeof body.countryCode === "string" ? body.countryCode.trim().toUpperCase() : "";
  if (!MARKET_PATTERN.test(marketId) || !COUNTRY_PATTERN.test(countryCode)) {
    return NextResponse.json({ error: "Проверьте рынок и страну" }, { status: 400 });
  }

  let result;
  if (action === "ensure_provider") {
    const timezone = typeof body.timezone === "string" ? body.timezone.trim() : "";
    const sourceCurrency = typeof body.sourceCurrency === "string" ? body.sourceCurrency.toUpperCase() : "";
    const displayCurrency = typeof body.displayCurrency === "string" ? body.displayCurrency.toUpperCase() : "";
    if (timezone.length < 3 || !CURRENCY_PATTERN.test(sourceCurrency) || !CURRENCY_PATTERN.test(displayCurrency)) {
      return NextResponse.json({ error: "Проверьте часовой пояс и валюты" }, { status: 400 });
    }
    result = await callMobilityRpc<Record<string, unknown>>("mobility_ensure_organizer_provider", {
      p_actor_user_id: auth.user.id,
      p_market_id: marketId,
      p_country_code: countryCode,
      p_timezone: timezone,
      p_source_currency: sourceCurrency,
      p_display_currency: displayCurrency,
      p_vertical: vertical,
    });
  } else if (action === "create_vehicle") {
    const providerId = typeof body.providerId === "string" ? body.providerId : "";
    const publicName = typeof body.publicName === "string" ? body.publicName.trim() : "";
    const timezone = typeof body.timezone === "string" ? body.timezone.trim() : "";
    const vehicleClass = typeof body.vehicleClass === "string" ? body.vehicleClass : "";
    const seats = Number(body.seatCapacity);
    const luggage = Number(body.luggageCapacity ?? 0);
    if (!providerId || publicName.length < 2 || timezone.length < 3 || !Number.isInteger(seats) || !Number.isInteger(luggage)) {
      return NextResponse.json({ error: "Проверьте данные автомобиля" }, { status: 400 });
    }
    result = await callMobilityRpc<Record<string, unknown>>("mobility_create_vehicle_draft", {
      p_actor_user_id: auth.user.id,
      p_provider_id: providerId,
      p_fleet_id: null,
      p_market_id: marketId,
      p_country_code: countryCode,
      p_timezone: timezone,
      p_public_name: publicName,
      p_vehicle_class: vehicleClass,
      p_seat_capacity: seats,
      p_luggage_capacity: luggage,
    });
  } else if (action === "create_offer") {
    const requiredStrings = ["providerId", "vehicleId", "pickupTimezone", "dropoffTimezone", "slug", "title", "originLabel", "destinationLabel", "sourceCurrency", "displayCurrency"];
    if (requiredStrings.some((key) => typeof body[key] !== "string" || String(body[key]).trim().length < 2)) {
      return NextResponse.json({ error: "Заполните обязательные поля предложения" }, { status: 400 });
    }
    const rateMinor = Number(body.rateMinor);
    if (!Number.isSafeInteger(rateMinor) || rateMinor < 0) {
      return NextResponse.json({ error: "Некорректная стоимость" }, { status: 400 });
    }
    result = await callMobilityRpc<Record<string, unknown>>("mobility_create_offer_draft", {
      p_actor_user_id: auth.user.id,
      p_vertical: vertical,
      p_provider_id: body.providerId,
      p_vehicle_id: body.vehicleId,
      p_market_id: marketId,
      p_country_code: countryCode,
      p_pickup_timezone: body.pickupTimezone,
      p_dropoff_timezone: body.dropoffTimezone,
      p_slug: body.slug,
      p_title: body.title,
      p_origin_label: body.originLabel,
      p_destination_label: body.destinationLabel,
      p_source_currency: body.sourceCurrency,
      p_display_currency: body.displayCurrency,
      p_rate_minor: rateMinor,
      p_policy: typeof body.policy === "object" && body.policy !== null ? body.policy : {},
    });
  } else if (action === "transition") {
    const expectedVersion = Number(body.expectedVersion);
    if (typeof body.entityId !== "string" || !["vehicle", "rental", "transfer"].includes(String(body.entityType)) || !Number.isSafeInteger(expectedVersion)) {
      return NextResponse.json({ error: "Некорректное изменение статуса" }, { status: 400 });
    }
    result = await callMobilityRpc<Record<string, unknown>>("mobility_transition_item", {
      p_actor_user_id: auth.user.id,
      p_actor_scope: "organizer",
      p_entity_type: body.entityType,
      p_entity_id: body.entityId,
      p_expected_version: expectedVersion,
      p_next_status: body.nextStatus,
    });
  } else if (action === "register_document") {
    if (typeof body.vehicleId !== "string" || typeof body.documentType !== "string" || typeof body.storageObjectRef !== "string" || typeof body.expiresAt !== "string") {
      return NextResponse.json({ error: "Проверьте данные документа" }, { status: 400 });
    }
    result = await callMobilityRpc<Record<string, unknown>>("mobility_register_private_document", {
      p_actor_user_id: auth.user.id,
      p_vehicle_id: body.vehicleId,
      p_document_type: body.documentType,
      p_storage_object_ref: body.storageObjectRef,
      p_identifier_last4: typeof body.identifierLast4 === "string" ? body.identifierLast4 : "",
      p_expires_at: body.expiresAt,
    });
  } else {
    return NextResponse.json({ error: "Неизвестное действие" }, { status: 400 });
  }
  if (!result.ok) return NextResponse.json({ error: result.message, code: result.code }, { status: statusForFailure(result.code) });
  return NextResponse.json({ result: result.data }, { status: action === "transition" ? 200 : 201 });
}
