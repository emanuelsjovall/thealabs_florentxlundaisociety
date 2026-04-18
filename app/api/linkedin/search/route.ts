import { NextResponse } from "next/server";
import { searchLinkedInProfiles } from "@/lib/linkedin";

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as { name?: string };
  const name = body.name?.trim();

  if (!name) {
    return NextResponse.json(
      { ok: false, error: "name is required", code: "PARSE_ERROR" },
      { status: 400 }
    );
  }

  const result = await searchLinkedInProfiles(name, { headless: true });
  return NextResponse.json(result);
}
