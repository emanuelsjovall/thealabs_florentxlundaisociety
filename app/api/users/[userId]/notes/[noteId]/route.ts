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

export async function PATCH(
  request: Request,
  {
    params,
  }: { params: Promise<{ userId: string; noteId: string }> }
): Promise<NextResponse> {
  const { userId, noteId } = await params
  const body = (await request.json()) as { content?: unknown }

  if (typeof body.content !== "string") {
    return NextResponse.json(
      { ok: false, error: "content is required" },
      { status: 400 }
    )
  }

  if (body.content.length > PERSONAL_NOTE_MAX_LENGTH) {
    return NextResponse.json(
      {
        ok: false,
        error: `Note must be at most ${PERSONAL_NOTE_MAX_LENGTH} characters`,
      },
      { status: 400 }
    )
  }

  try {
    const row = await prisma.note.update({
      where: {
        id: noteId,
        userId,
      },
      data: { content: body.content },
    })
    return NextResponse.json({ ok: true, data: serializeNote(row) })
  } catch {
    return NextResponse.json(
      { ok: false, error: "Note not found" },
      { status: 404 }
    )
  }
}

export async function DELETE(
  _request: Request,
  {
    params,
  }: { params: Promise<{ userId: string; noteId: string }> }
): Promise<NextResponse> {
  const { userId, noteId } = await params

  try {
    await prisma.note.delete({
      where: {
        id: noteId,
        userId,
      },
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json(
      { ok: false, error: "Note not found" },
      { status: 404 }
    )
  }
}
