import { NextResponse } from "next/server"
import { searchLinkedInProfiles } from "@/lib/linkedin"
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as { name?: string }
  const name = body.name?.trim()

  if (!name) {
    return NextResponse.json(
      { ok: false, error: "name is required", code: "PARSE_ERROR" },
      { status: 400 },
    )
  }

  const normalizedQuery = name.toLowerCase()

  const cached = await prisma.linkedinSearch.findUnique({
    where: { query: normalizedQuery },
  })

  if (cached) {
    return NextResponse.json({ ok: true, data: cached.result })
  }

  const result = await searchLinkedInProfiles(name, { headless: true })

  if (result.ok) {
    await prisma.linkedinSearch.create({
      data: {
        query: normalizedQuery,
        result: result.data as unknown as Prisma.InputJsonValue,
      },
    })
  }

  return NextResponse.json(result)
}
