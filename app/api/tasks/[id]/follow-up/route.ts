import { requireLocalAuth } from "@/lib/hologram/auth";
import { getRunner } from "@/lib/hologram/runner";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const authError = requireLocalAuth(request);
  if (authError) return authError;

  const body = (await request.json()) as { prompt?: string };
  const prompt = body.prompt?.trim();

  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
  }

  try {
    const task = await getRunner().sendFollowUp(params.id, prompt);
    return NextResponse.json({ task });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Follow-up failed." },
      { status: 400 }
    );
  }
}
