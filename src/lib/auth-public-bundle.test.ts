import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { hasBrowserSupabaseAuthCookie } from "@/context/AuthContext";

describe("anonymous public auth shell", () => {
  it("recognizes regular and chunked Supabase SSR session cookies", () => {
    expect(hasBrowserSupabaseAuthCookie("theme=light; sb-project-auth-token=value")).toBe(true);
    expect(hasBrowserSupabaseAuthCookie("sb-project-auth-token.0=value; locale=ru")).toBe(true);
    expect(hasBrowserSupabaseAuthCookie("theme=light; pa_vid=guest")).toBe(false);
  });

  it("keeps Supabase browser code behind dynamic imports", () => {
    const context = readFileSync(join(process.cwd(), "src/context/AuthContext.tsx"), "utf8");
    const provider = readFileSync(
      join(process.cwd(), "src/lib/auth-provider-active.ts"),
      "utf8",
    );

    expect(context).not.toContain(
      'import { createSupabaseBrowserClient } from "@/lib/supabase/client"',
    );
    expect(context).toContain('import("@/lib/supabase/client")');
    expect(context).toContain("{authOpen ? <AuthModal /> : null}");
    expect(context).toContain("loading: AuthModalLoadingFallback");
    expect(provider).not.toContain(
      'import { supabaseAuthProvider } from "@/lib/supabase-auth-provider"',
    );
    expect(provider).toContain('import("@/lib/supabase-auth-provider")');
  });
});
