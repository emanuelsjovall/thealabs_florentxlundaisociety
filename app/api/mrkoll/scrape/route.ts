import { NextResponse } from "next/server";
import { mrkollUrl } from "@/lib/mrkoll";

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as { url?: string };
  const url = body.url?.trim();

  if (!url) {
    return NextResponse.json(
      { ok: false, error: "url is required", code: "PARSE_ERROR" },
      { status: 400 }
    );
  }

  const result = await mrkollUrl(url, { headless: true });
  return NextResponse.json(result);
}
