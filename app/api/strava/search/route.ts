import { NextResponse } from "next/server";
import { searchStravaAthletes } from "@/lib/strava";

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as { name?: string };
  const name = body.name?.trim();

  if (!name) {
    return NextResponse.json(
      { ok: false, error: "name is required", code: "PARSE_ERROR" },
      { status: 400 }
    );
  }

  const result = await searchStravaAthletes(name);
  return NextResponse.json(result);
}
