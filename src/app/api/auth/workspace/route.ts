import { NextResponse } from "next/server";
import { resolveUserExperienceContext, toUserExperienceHydration } from "@/lib/user-experience/server";
import {
  ACTIVE_WORKSPACE_COOKIE,
  isWorkspaceAvailable,
  WORKSPACE_META,
} from "@/lib/user-experience/workspaces";
import type { ActiveWorkspace } from "@/types/user-experience";

const WORKSPACES: ActiveWorkspace[] = ["travel", "organizer", "admin"];

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { workspace?: string } | null;
  if (!body?.workspace || !WORKSPACES.includes(body.workspace as ActiveWorkspace)) {
    return NextResponse.json({ error: "Выберите рабочее пространство" }, { status: 400 });
  }

  const context = await resolveUserExperienceContext();
  if (!context.authenticated) {
    return NextResponse.json({ error: "Войдите в аккаунт" }, { status: 401 });
  }

  const workspace = body.workspace as ActiveWorkspace;
  if (!isWorkspaceAvailable(context.roles, workspace)) {
    return NextResponse.json({ error: "Это рабочее пространство недоступно" }, { status: 403 });
  }

  const response = NextResponse.json({
    context: toUserExperienceHydration({
      ...context,
      activeWorkspace: workspace,
      primaryIntent: WORKSPACE_META[workspace].intent,
    }),
    href: WORKSPACE_META[workspace].href,
  });
  response.cookies.set(ACTIVE_WORKSPACE_COOKIE, workspace, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
