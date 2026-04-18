import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { buildDefaultPerson } from "@/lib/user-record"
import { serializeUserRecord, toJsonInput, userSelect } from "@/lib/user-store"

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

  if (!user.person) {
    user = await prisma.user.update({
      where: { id: userId },
      data: {
        person: toJsonInput(user.person ?? buildDefaultPerson(user.name)),
      },
      select: userSelect,
    })
  }

  return NextResponse.json({ ok: true, data: serializeUserRecord(user) })
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
    twitterUsername?: string | null
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
      twitterUsername:
        body.twitterUsername === undefined
          ? undefined
          : body.twitterUsername?.trim().replace(/^@+/, "") || null,
      breach: toJsonInput(body.breach),
      updatedAt: new Date(),
    },
    select: userSelect,
  })

  return NextResponse.json({ ok: true, data: serializeUserRecord(user) })
}
