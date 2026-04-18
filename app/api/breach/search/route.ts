import { NextResponse } from "next/server"
import { searchBreach } from "@/lib/breach"

const ALL_FIELDS = ["name"] as const

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as { name?: string }
  const name = body.name?.trim()

  if (!name) {
    return NextResponse.json(
      { ok: false, error: "name is required" },
      { status: 400 }
    )
  }

  const result = await searchBreach(name, [...ALL_FIELDS])

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error, code: result.code },
      { status: result.code === "RATE_LIMITED" ? 429 : 500 }
    )
  }

  return NextResponse.json({ ok: true, data: result.data })
}
