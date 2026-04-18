import { NextResponse } from "next/server"
import { searchGithubUsers } from "@/lib/github-api"

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as { query?: string }
  const query = body.query?.trim()

  if (!query) {
    return NextResponse.json(
      { ok: false, error: "query is required", code: "PARSE_ERROR" },
      { status: 400 }
    )
  }

  try {
    const data = await searchGithubUsers(query)
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to search GitHub"
    return NextResponse.json({ ok: false, error: message })
  }
}
