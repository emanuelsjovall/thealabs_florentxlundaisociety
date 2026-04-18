import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

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
      { status: 400 },
    )
  }

  const normalizedName = name.toLowerCase()

  const user = await prisma.user.upsert({
    where: { normalizedName },
    create: { name, normalizedName },
    update: { updatedAt: new Date() },
  })

  return NextResponse.json({ ok: true, data: user })
}
