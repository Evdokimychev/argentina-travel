import { describe, expect, it, vi } from "vitest";
import {
  changePasswordWithCurrentCredential,
  validatePasswordChange,
  type PasswordChangeAuthClient,
} from "./auth-password-change";

function createAuthClient(input?: {
  email?: string | null;
  signInError?: { message: string } | null;
  updateError?: { message: string } | null;
}) {
  const calls: string[] = [];
  const client: PasswordChangeAuthClient = {
    auth: {
      getUser: vi.fn(async () => {
        calls.push("getUser");
        return {
          data: { user: input?.email === null ? null : { email: input?.email ?? "owner@example.com" } },
          error: null,
        };
      }),
      signInWithPassword: vi.fn(async () => {
        calls.push("signInWithPassword");
        return { error: input?.signInError ?? null };
      }),
      updateUser: vi.fn(async () => {
        calls.push("updateUser");
        return { error: input?.updateError ?? null };
      }),
    },
  };

  return { client, calls };
}

const validInput = {
  currentPassword: "old-password",
  newPassword: "new-password",
  confirmPassword: "new-password",
};

describe("profile password change", () => {
  it("requires the current password before calling Supabase", async () => {
    const { client, calls } = createAuthClient();
    const result = await changePasswordWithCurrentCredential(client, {
      ...validInput,
      currentPassword: "",
    });

    expect(result).toMatchObject({ ok: false, code: "CURRENT_PASSWORD_REQUIRED" });
    expect(calls).toEqual([]);
  });

  it("does not update the password when reauthentication fails", async () => {
    const { client, calls } = createAuthClient({
      signInError: { message: "Invalid login credentials" },
    });
    const result = await changePasswordWithCurrentCredential(client, validInput);

    expect(result).toMatchObject({ ok: false, code: "CURRENT_PASSWORD_INVALID" });
    expect(calls).toEqual(["getUser", "signInWithPassword"]);
    expect(client.auth.updateUser).not.toHaveBeenCalled();
  });

  it("reauthenticates before updating the password", async () => {
    const { client, calls } = createAuthClient();
    const result = await changePasswordWithCurrentCredential(client, validInput);

    expect(result).toEqual({ ok: true });
    expect(calls).toEqual(["getUser", "signInWithPassword", "updateUser"]);
    expect(client.auth.signInWithPassword).toHaveBeenCalledWith({
      email: "owner@example.com",
      password: "old-password",
    });
    expect(client.auth.updateUser).toHaveBeenCalledWith({ password: "new-password" });
  });

  it("rejects mismatched and unchanged passwords", () => {
    expect(
      validatePasswordChange({ ...validInput, confirmPassword: "different-password" }),
    ).toMatchObject({ ok: false, code: "PASSWORD_MISMATCH" });
    expect(
      validatePasswordChange({
        currentPassword: "same-password",
        newPassword: "same-password",
        confirmPassword: "same-password",
      }),
    ).toMatchObject({ ok: false, code: "PASSWORD_UNCHANGED" });
  });
});
