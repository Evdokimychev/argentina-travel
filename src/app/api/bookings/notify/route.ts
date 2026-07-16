import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Уведомления отправляются только из подтверждённых серверных операций." },
    { status: 404 }
  );
}
