import { requireLocalAuth } from "@/lib/hologram/auth";
import { getRunner } from "@/lib/hologram/runner";
import type { ApprovalDecision } from "@/lib/hologram/types";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const decisions: ApprovalDecision[] = ["approve_once", "approve_session", "decline"];

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const authError = requireLocalAuth(request);
  if (authError) return authError;

  const body = (await request.json()) as { approvalId?: string; decision?: ApprovalDecision };

  if (!body.approvalId || !body.decision || !decisions.includes(body.decision)) {
    return NextResponse.json({ error: "Valid approvalId and decision are required." }, { status: 400 });
  }

  try {
    const task = await getRunner().approve(params.id, body.approvalId, body.decision);
    return NextResponse.json({ task });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Approval failed." },
      { status: 400 }
    );
  }
}
