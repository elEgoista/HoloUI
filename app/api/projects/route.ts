import { requireLocalAuth } from "@/lib/hologram/auth";
import { getPublicProjectsWithGit } from "@/lib/hologram/config";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authError = requireLocalAuth(request);
  if (authError) return authError;

  return NextResponse.json({ projects: await getPublicProjectsWithGit() });
}
