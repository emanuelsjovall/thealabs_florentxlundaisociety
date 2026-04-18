import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
): Promise<NextResponse> {
  const { userId } = await params

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      linkedinUrl: true,
      linkedin: true,
      twitter: true,
      updatedAt: true,
    },
  })

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "User not found" },
      { status: 404 },
    )
  }

  return NextResponse.json({ ok: true, data: user })
}
