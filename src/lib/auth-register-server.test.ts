import { describe, expect, it } from "vitest";
import { registerSupabaseUser } from "@/lib/auth-register-server";

const validInput = {
  firstName: "Иван",
  lastName: "Иванов",
  phone: "+79990000000",
  email: "ivan@example.com",
  password: "safe-password",
} as const;

describe("public registration role policy", () => {
  it.each(["organizer", "admin"] as const)(
    "never grants the %s role through public registration",
    async (role) => {
      const result = await registerSupabaseUser({ ...validInput, role });

      expect(result).toEqual({
        ok: false,
        code: "VALIDATION",
        error:
          "Публичная регистрация создаёт аккаунт туриста. Роль организатора назначается после проверки заявки.",
      });
    },
  );
});
