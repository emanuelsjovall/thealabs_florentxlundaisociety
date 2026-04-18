import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { buildDefaultPerson } from "@/lib/user-record"
import { toJsonInput } from "@/lib/user-store"

export async function GET(): Promise<NextResponse> {
  const users = await prisma.user.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      linkedinUrl: true,
      linkedin: true,
      twitter: true,
      updatedAt: true,
    },
  })

  return NextResponse.json({ ok: true, data: users })
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as { name?: string }
  const name = body.name?.trim()

  if (!name) {
    return NextResponse.json(
      { ok: false, error: "name is required" },
      { status: 400 }
    )
  }

  const normalizedName = name.toLowerCase()
  const existing = await prisma.user.findUnique({
    where: { normalizedName },
    select: {
      id: true,
      person: true,
    },
  })

  const user = existing
    ? await prisma.user.update({
        where: { id: existing.id },
        data: {
          updatedAt: new Date(),
          person: toJsonInput(existing.person ?? buildDefaultPerson(name)),
        },
      })
    : await prisma.user.create({
        data: {
          name,
          normalizedName,
          person: toJsonInput(buildDefaultPerson(name)),
        },
      })

  return NextResponse.json({ ok: true, data: user })
}
