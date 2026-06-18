import { requireLocalAuth } from "@/lib/hologram/auth";
import { getRunner } from "@/lib/hologram/runner";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const authError = requireLocalAuth(_request);
  if (authError) return authError;

  const task = await getRunner().getTask(params.id);

  if (!task) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }

  return NextResponse.json({ task });
}
