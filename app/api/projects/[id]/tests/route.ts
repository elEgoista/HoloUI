import { requireLocalAuth } from "@/lib/hologram/auth";
import { getProjectConfig } from "@/lib/hologram/config";
import { runTestCommand } from "@/lib/hologram/localCommands";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const authError = requireLocalAuth(_request);
  if (authError) return authError;

  try {
    const project = getProjectConfig(params.id);
    return NextResponse.json(await runTestCommand(project.path, project.testCommand));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Test command failed." },
      { status: 400 }
    );
  }
}
