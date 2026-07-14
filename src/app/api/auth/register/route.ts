import { NextResponse } from "next/server";
import { isSupabaseAuthEnabled } from "@/lib/auth-mode";
import { registerSupabaseUser } from "@/lib/auth-register-server";
import { getClientIp, withRateLimit } from "@/lib/rate-limit";
import type { AccountRole } from "@/types/user";
import { authRedirectUrl } from "@/lib/site-url";

async function postRegister(request: Request) {
  if (!isSupabaseAuthEnabled()) {
    return NextResponse.json({ error: "Supabase auth disabled" }, { status: 503 });
  }

  try {
    const body = (await request.json()) as {
      role?: AccountRole;
      firstName?: string;
      lastName?: string;
      phone?: string;
      email?: string;
      password?: string;
    };

    const role = body.role ?? "tourist";
    if (role === "admin") {
      return NextResponse.json(
        { error: "Роль администратора назначается вручную", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const result = await registerSupabaseUser({
      role,
      firstName: body.firstName ?? "",
      lastName: body.lastName ?? "",
      phone: body.phone ?? "",
      email: body.email ?? "",
      password: body.password,
      emailRedirectTo: authRedirectUrl("/auth/callback?next=/profile", request.url),
    });

    if (!result.ok) {
      const status =
        result.code === "DUPLICATE_PHONE" || result.code === "DUPLICATE_EMAIL"
          ? 409
          : result.code === "VALIDATION"
            ? 400
            : 500;

      return NextResponse.json(
        { error: result.error, code: result.code },
        { status }
      );
    }

    return NextResponse.json({
      ok: true,
      userId: result.userId,
      confirmationRequired: result.confirmationRequired,
    });
  } catch {
    return NextResponse.json(
      { error: "Регистрация временно недоступна. Попробуйте позже." },
      { status: 500 }
    );
  }
}

export const POST = withRateLimit(postRegister, {
  limit: 5,
  window: 600_000,
  keyPrefix: "auth:register",
  key: (request) => `ip:${getClientIp(request)}`,
  message: "Слишком много попыток регистрации. Попробуйте позже.",
});
