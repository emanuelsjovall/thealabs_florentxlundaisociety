import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  PERSONAL_NOTE_MAX_LENGTH,
  type PersonalNote,
} from "@/lib/personal-note"

function serializeNote(row: {
  id: string
  content: string
  createdAt: Date
  updatedAt: Date
}): PersonalNote {
  return {
    id: row.id,
    content: row.content,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
): Promise<NextResponse> {
  const { userId } = await params

  const userExists = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  })

  if (!userExists) {
    return NextResponse.json(
      { ok: false, error: "User not found" },
      { status: 404 }
    )
  }

  const rows = await prisma.note.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  })

  return NextResponse.json({
    ok: true,
    data: rows.map(serializeNote),
  })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
): Promise<NextResponse> {
  const { userId } = await params
  const body = (await request.json()) as { content?: string }

  const userExists = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  })

  if (!userExists) {
    return NextResponse.json(
      { ok: false, error: "User not found" },
      { status: 404 }
    )
  }

  const raw = body.content ?? ""
  if (typeof raw !== "string") {
    return NextResponse.json(
      { ok: false, error: "Invalid content" },
      { status: 400 }
    )
  }

  if (raw.length > PERSONAL_NOTE_MAX_LENGTH) {
    return NextResponse.json(
      {
        ok: false,
        error: `Note must be at most ${PERSONAL_NOTE_MAX_LENGTH} characters`,
      },
      { status: 400 }
    )
  }

  const row = await prisma.note.create({
    data: {
      userId,
      content: raw,
    },
  })

  return NextResponse.json({ ok: true, data: serializeNote(row) })
}
