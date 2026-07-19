import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { clientIpFromRequest, writeAdminAuditLog } from "@/lib/admin/audit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "prompts.view"); if (!auth.ok) return auth.response;
  const { data, error } = await createSupabaseAdminClient().from("ingestion_prompt_versions").select("*").order("task").order("version", { ascending: false });
  return error ? NextResponse.json({ error: "Не удалось загрузить правила" }, { status: 503 }) : NextResponse.json({ prompts: data ?? [] });
}
export async function POST(request: Request) {
  const auth = await authorizeAdminRequest(request, "prompts.manage"); if (!auth.ok) return auth.response;
  const body = await request.json() as { task?: string; model?: string; systemPrompt?: string; outputSchema?: Json; activate?: boolean };
  if (!body.task?.trim() || !body.model?.trim() || !body.systemPrompt?.trim()) return NextResponse.json({ error: "Заполните задачу, модель и инструкцию" }, { status: 400 });
  const db = createSupabaseAdminClient(); const { data: latest } = await db.from("ingestion_prompt_versions").select("version").eq("task", body.task).order("version", { ascending: false }).limit(1).maybeSingle(); const version = (latest?.version ?? 0) + 1; const id = `${body.task}:v${version}`;
  if (body.activate) await db.from("ingestion_prompt_versions").update({ status: "retired" }).eq("task", body.task).eq("status", "active");
  const { data, error } = await db.from("ingestion_prompt_versions").insert({ id, task: body.task, version, model: body.model, system_prompt: body.systemPrompt, output_schema: body.outputSchema ?? {}, status: body.activate ? "active" : "draft", activated_at: body.activate ? new Date().toISOString() : null, created_by: /^[0-9a-f-]{36}$/i.test(auth.actorId) ? auth.actorId : null }).select("*").single();
  if (error) return NextResponse.json({ error: "Не удалось сохранить версию правила" }, { status: 409 });
  await writeAdminAuditLog({ actorUserId: auth.actorId, action: "ingestion.prompt.create", entityType: "ingestion_prompt", entityId: id, payload: { task: body.task, version, active: body.activate }, ipAddress: clientIpFromRequest(request) });
  return NextResponse.json({ prompt: data }, { status: 201 });
}
