import { requireLocalAuth } from "@/lib/hologram/auth";
import { getProjectConfig } from "@/lib/hologram/config";
import { getRunner } from "@/lib/hologram/runner";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authError = requireLocalAuth(request);
  if (authError) return authError;

  const url = new URL(request.url);
  const projectId = url.searchParams.get("projectId") ?? undefined;
  const tasks = await getRunner().listTasks(projectId);
  return NextResponse.json({ tasks });
}

export async function DELETE(request: Request) {
  const authError = requireLocalAuth(request);
  if (authError) return authError;

  const runner = getRunner();
  await runner.reset?.();
  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  const authError = requireLocalAuth(request);
  if (authError) return authError;

  const body = (await request.json()) as {
    projectId?: string;
    prompt?: string;
    transcript?: string;
    source?: "voice" | "text" | "mock" | "api";
  };
  const projectId = body.projectId ?? "default";
  const prompt = body.prompt?.trim();

  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
  }

  try {
    getProjectConfig(projectId);
    const task = await getRunner().startTask({
      projectId,
      prompt,
      transcript: body.transcript?.trim() || prompt,
      source: body.source ?? "api"
    });
    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Task creation failed." },
      { status: 400 }
    );
  }
}
