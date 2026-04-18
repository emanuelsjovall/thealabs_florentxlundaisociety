import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { buildDefaultPerson, buildDefaultTwitter } from "@/lib/user-record"

const userSelect = {
  id: true,
  name: true,
  person: true,
  linkedinUrl: true,
  linkedin: true,
  strava: true,
  mrkoll: true,
  activeCompany: true,
  krafman: true,
  twitter: true,
  breach: true,
  updatedAt: true,
} as const

function toJsonInput(
  value: unknown | null | undefined
): Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined {
  if (value === undefined) return undefined
  if (value === null) return Prisma.JsonNull

  return value as Prisma.InputJsonValue
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
): Promise<NextResponse> {
  const { userId } = await params

  let user = await prisma.user.findUnique({
    where: { id: userId },
    select: userSelect,
  })

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "User not found" },
      { status: 404 }
    )
  }

  if (!user.person || !user.twitter) {
    user = await prisma.user.update({
      where: { id: userId },
      data: {
        person: toJsonInput(user.person ?? buildDefaultPerson(user.name)),
        twitter: toJsonInput(user.twitter ?? buildDefaultTwitter(user.name)),
      },
      select: userSelect,
    })
  }

  return NextResponse.json({ ok: true, data: user })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
): Promise<NextResponse> {
  const { userId } = await params
  const body = (await request.json()) as {
    person?: unknown | null
    linkedin?: unknown | null
    linkedinUrl?: string | null
    strava?: unknown | null
    mrkoll?: unknown | null
    activeCompany?: unknown | null
    krafman?: unknown | null
    twitter?: unknown | null
    breach?: unknown | null
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      person: toJsonInput(body.person),
      linkedin: toJsonInput(body.linkedin),
      linkedinUrl:
        body.linkedinUrl === undefined
          ? undefined
          : body.linkedinUrl?.trim() || null,
      strava: toJsonInput(body.strava),
      mrkoll: toJsonInput(body.mrkoll),
      activeCompany: toJsonInput(body.activeCompany),
      krafman: toJsonInput(body.krafman),
      twitter: toJsonInput(body.twitter),
      breach: toJsonInput(body.breach),
      updatedAt: new Date(),
    },
    select: userSelect,
  })

  return NextResponse.json({ ok: true, data: user })
}
