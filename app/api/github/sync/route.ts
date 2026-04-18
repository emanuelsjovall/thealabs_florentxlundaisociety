import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { fetchGithubProfile, normalizeGithubLogin } from "@/lib/github-api"
import type { UserGithubProfile } from "@/lib/user-record"
import { serializeUserRecord, toJsonInput, userSelect } from "@/lib/user-store"

const GITHUB_CACHE_TTL_MS = 30 * 60 * 1000

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as {
    userId?: string
    username?: string
    force?: boolean
  }

  const userId = body.userId?.trim()
  if (!userId) {
    return NextResponse.json(
      { ok: false, error: "userId is required" },
      { status: 400 }
    )
  }

  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      github: true,
      githubUsername: true,
      githubFetchedAt: true,
    },
  })

  if (!existingUser) {
    return NextResponse.json(
      { ok: false, error: "User not found" },
      { status: 404 }
    )
  }

  const fromBody = body.username?.trim()
  const fromStored =
    (existingUser.github as UserGithubProfile | null)?.login ??
    existingUser.githubUsername ??
    ""

  const login = normalizeGithubLogin(fromBody ?? fromStored)

  if (!login) {
    return NextResponse.json(
      {
        ok: false,
        error: "Enter a GitHub username to load data for this user.",
      },
      { status: 400 }
    )
  }

  const isFresh =
    !body.force &&
    existingUser.githubFetchedAt != null &&
    Date.now() - existingUser.githubFetchedAt.getTime() < GITHUB_CACHE_TTL_MS

  if (isFresh) {
    const cachedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: userSelect,
    })

    if (cachedUser) {
      return NextResponse.json({
        ok: true,
        data: serializeUserRecord(cachedUser),
      })
    }
  }

  try {
    const profile = await fetchGithubProfile(login)

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        github: toJsonInput(profile),
        githubUsername: profile.login,
        githubFetchedAt: new Date(),
        updatedAt: new Date(),
      },
      select: userSelect,
    })

    return NextResponse.json({
      ok: true,
      data: serializeUserRecord(updatedUser),
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to sync GitHub profile"
    return NextResponse.json({ ok: false, error: message })
  }
}
