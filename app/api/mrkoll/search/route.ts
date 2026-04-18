import { NextResponse } from "next/server";
import { mrkoll } from "@/lib/mrkoll";

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as { name?: string; location?: string };
  const name = body.name?.trim();
  const location = body.location?.trim() || "";

  if (!name) {
    return NextResponse.json(
      { ok: false, error: "name is required", code: "PARSE_ERROR" },
      { status: 400 }
    );
  }

  const result = await mrkoll(name, location, { headless: true });
  return NextResponse.json(result);
}
