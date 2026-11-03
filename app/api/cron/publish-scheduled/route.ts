import { NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/cronAuth";

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Invalid or unconfigured cron secret" },
      { status: 401 },
    );
  }

  return NextResponse.json(
    { success: false, error: "Scheduled publishing is disabled." },
    { status: 410 },
  );
}
