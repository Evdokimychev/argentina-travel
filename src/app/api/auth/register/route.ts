import { NextResponse } from "next/server";
import { isSupabaseAuthEnabled } from "@/lib/auth-mode";
import { registerSupabaseUser } from "@/lib/auth-register-server";
import { getClientIp, withRateLimit } from "@/lib/rate-limit";
import type { AccountRole } from "@/types/user";
import { authRedirectUrl } from "@/lib/site-url";
import { normalizeAuthEmail } from "@/lib/auth-flow";

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

    const requestedRole = body.role ?? "tourist";
    if (requestedRole === "admin") {
      return NextResponse.json(
        { error: "Роль администратора назначается вручную", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const result = await registerSupabaseUser({
      role: "tourist",
      firstName: body.firstName ?? "",
      lastName: body.lastName ?? "",
      phone: body.phone ?? "",
      email: normalizeAuthEmail(body.email ?? ""),
      password: body.password,
      emailRedirectTo: authRedirectUrl(
        requestedRole === "organizer" ? "/auth/confirm?next=/join" : "/auth/confirm?next=/profile",
        request.url,
      ),
    });

    if (!result.ok) {
      if (result.code === "DUPLICATE_PHONE" || result.code === "DUPLICATE_EMAIL") {
        return NextResponse.json({ ok: true, confirmationRequired: true });
      }
      const status =
        result.code === "VALIDATION"
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
      organizerApplicationRequired: requestedRole === "organizer",
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
