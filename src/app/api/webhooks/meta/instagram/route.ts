import { NextResponse } from "next/server";
import {
  ingestMetaWebhook,
  verifyMetaWebhookChallenge,
  verifyMetaWebhookSignature,
} from "@/lib/content-factory/webhooks";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const challenge = await verifyMetaWebhookChallenge("instagram", request.url);
    return challenge !== null
      ? new NextResponse(challenge, { status: 200 })
      : NextResponse.json({ error: "Проверка вебхука не пройдена." }, { status: 403 });
  } catch {
    return NextResponse.json({ error: "Подключение Instagram не настроено." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  try {
    if (!await verifyMetaWebhookSignature("instagram", rawBody, request.headers.get("x-hub-signature-256"))) {
      return NextResponse.json({ error: "Подпись вебхука не прошла проверку." }, { status: 401 });
    }
    const payload = JSON.parse(rawBody) as unknown;
    return NextResponse.json({ ok: true, ...await ingestMetaWebhook("instagram", payload) });
  } catch {
    return NextResponse.json({ error: "Не удалось обработать вебхук." }, { status: 400 });
  }
}

