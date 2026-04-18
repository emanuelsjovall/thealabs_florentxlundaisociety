import { NextResponse } from "next/server"
import { scrapeLinkedInProfile } from "@/lib/linkedin"
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as { url?: string; searchName?: string }
  const url = body.url?.trim()

  if (!url) {
    return NextResponse.json(
      { ok: false, error: "url is required", code: "PARSE_ERROR" },
      { status: 400 },
    )
  }

  const normalizedUrl = url.replace(/\/$/, "")

  const cached = await prisma.user.findUnique({
    where: { linkedinUrl: normalizedUrl },
  })

  if (cached?.linkedin) {
    return NextResponse.json({ ok: true, data: cached.linkedin })
  }

  const result = await scrapeLinkedInProfile(url, { headless: true })

  if (result.ok) {
    const profile = result.data
    const name = profile.name ?? "Unknown"
    const normalizedName = (body.searchName ?? name).toLowerCase()

    // Try to find user created at search time and attach LinkedIn data
    const existing = await prisma.user.findUnique({
      where: { normalizedName },
    })

    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          linkedinUrl: normalizedUrl,
          linkedin: profile as unknown as Prisma.InputJsonValue,
        },
      })
    } else {
      await prisma.user.create({
        data: {
          name,
          normalizedName,
          linkedinUrl: normalizedUrl,
          linkedin: profile as unknown as Prisma.InputJsonValue,
        },
      })
    }
  }

  return NextResponse.json(result)
}
