import { NextResponse } from "next/server";
import { scrapeStrava } from "@/lib/strava";

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as { athleteId?: string };
  const athleteId = body.athleteId?.trim();

  if (!athleteId) {
    return NextResponse.json(
      { ok: false, error: "athleteId is required", code: "PARSE_ERROR" },
      { status: 400 }
    );
  }

  const result = await scrapeStrava(athleteId);
  return NextResponse.json(result);
}
