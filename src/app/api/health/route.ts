import { NextResponse } from "next/server";
import { env } from "@/shared/config/env";
export async function GET() {
  return NextResponse.json(
    { status: "configured", mode: env().APP_MODE },
    { headers: { "Cache-Control": "no-store" } },
  );
}
