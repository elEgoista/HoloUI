import { isLocalAuthEnabled, requireLocalAuth } from "@/lib/hologram/auth";
import { getHologramConfig, getPublicProjectsWithGit } from "@/lib/hologram/config";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authError = requireLocalAuth(request);
  if (authError) return authError;

  const config = getHologramConfig();

  return NextResponse.json({
    projects: await getPublicProjectsWithGit(),
    server: config.server,
    runner: config.runner,
    allowLan: process.env.ALLOW_LAN === "true",
    tokenRequired: isLocalAuthEnabled()
  });
}
