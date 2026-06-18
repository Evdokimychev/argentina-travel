import { NextResponse } from "next/server";

/** @deprecated Вход выполняется на клиенте через supabase.auth.signInWithPassword. */
export async function POST() {
  return NextResponse.json(
    { error: "Используйте клиентский вход через модальное окно авторизации." },
    { status: 410 }
  );
}
