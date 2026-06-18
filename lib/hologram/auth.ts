import { NextResponse } from "next/server";

const tokenHeader = "x-holocodex-token";

export function getLocalToken() {
  return (
    process.env.HOCODEX_LOCAL_TOKEN ||
    process.env.HOLODEX_LOCAL_TOKEN ||
    process.env.HOLOCODEX_LOCAL_TOKEN ||
    ""
  ).trim();
}

export function isLocalAuthEnabled() {
  return Boolean(getLocalToken());
}

export function requireLocalAuth(request: Request) {
  const expected = getLocalToken();

  if (!expected) {
    return null;
  }

  const headerToken = request.headers.get(tokenHeader)?.trim();
  const authorization = request.headers.get("authorization")?.trim();
  const bearerToken = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : "";
  const queryToken = new URL(request.url).searchParams.get("token")?.trim();

  if (headerToken === expected || bearerToken === expected || queryToken === expected) {
    return null;
  }

  return NextResponse.json(
    { error: "Local token is required.", tokenRequired: true },
    { status: 401 }
  );
}
