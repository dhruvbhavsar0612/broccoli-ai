import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Return app configuration (public settings only)
export async function GET() {
  const enableAuth = process.env.ENABLE_AUTH === "true";

  return NextResponse.json({
    enableAuth,
  });
}
