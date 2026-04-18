import { NextResponse } from "next/server"
import { searchTwitterUsers } from "@/lib/twitter-api"

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as { name?: string }
  const name = body.name?.trim()

  if (!name) {
    return NextResponse.json(
      { ok: false, error: "name is required", code: "PARSE_ERROR" },
      { status: 400 }
    )
  }

  try {
    const data = await searchTwitterUsers(name)
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to search X"
    return NextResponse.json({ ok: false, error: message })
  }
}
