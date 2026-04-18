import { NextResponse } from "next/server";
import { scrapeStravaActivity } from "@/lib/strava";

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as { activityId?: string };
  const activityId = body.activityId?.trim();

  if (!activityId) {
    return NextResponse.json(
      { ok: false, error: "activityId is required", code: "PARSE_ERROR" },
      { status: 400 }
    );
  }

  const result = await scrapeStravaActivity(activityId);
  return NextResponse.json(result);
}
