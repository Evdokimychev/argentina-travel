import { NextResponse } from "next/server";
import { resolveUserExperienceContext, toUserExperienceHydration } from "@/lib/user-experience/server";

export async function GET() {
  const context = await resolveUserExperienceContext();
  return NextResponse.json(toUserExperienceHydration(context), {
    headers: { "Cache-Control": "private, no-store" },
  });
}
