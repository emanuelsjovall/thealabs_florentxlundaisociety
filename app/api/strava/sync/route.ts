import { NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { StravaScraper } from "@/lib/strava/strava-scraper"
import { serializeUserRecord, toJsonInput, userSelect } from "@/lib/user-store"
import type { StravaActivityDetail } from "@/lib/strava/strava.types"

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as {
    userId?: string
    athleteId?: string
  }

  const userId = body.userId?.trim()
  const athleteId = body.athleteId?.trim()

  if (!userId) {
    return NextResponse.json(
      { ok: false, error: "userId is required" },
      { status: 400 }
    )
  }

  if (!athleteId) {
    return NextResponse.json(
      { ok: false, error: "athleteId is required" },
      { status: 400 }
    )
  }

  const cookie = process.env.STRAVA_COOKIE
  if (!cookie) {
    return NextResponse.json(
      { ok: false, error: "STRAVA_COOKIE not configured", code: "MISSING_CREDENTIALS" },
      { status: 500 }
    )
  }

  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  })

  if (!existingUser) {
    return NextResponse.json(
      { ok: false, error: "User not found" },
      { status: 404 }
    )
  }

  const scraper = new StravaScraper(cookie)

  // 1. Scrape athlete profile (name, avatar) + all paginated activities
  const profileResult = await scraper.scrapeAthleteProfile(athleteId)
  if (!profileResult.ok) {
    return NextResponse.json(profileResult, { status: 500 })
  }

  const profile = profileResult.data

  // 2. Fetch detailed data for every activity (with concurrency control)
  const details = await scraper.fetchActivitiesWithDetails(
    profile.activities,
    3
  )

  // 3. Store everything in DB
  const activityRows = details.map((d) => toActivityRow(userId, d))

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        strava: toJsonInput({
          athleteId: profile.athleteId,
          name: profile.name,
          profileImageUrl: profile.profileImageUrl,
          totalActivities: profile.totalActivities,
          activities: [],
        }),
        stravaAthleteId: profile.athleteId,
        stravaFetchedAt: new Date(),
        updatedAt: new Date(),
      },
    }),
    prisma.stravaActivity.deleteMany({ where: { userId } }),
    prisma.stravaActivity.createMany({ data: activityRows }),
  ])

  const updatedUser = await prisma.user.findUnique({
    where: { id: userId },
    select: userSelect,
  })

  if (!updatedUser) {
    return NextResponse.json(
      { ok: false, error: "User not found after sync" },
      { status: 404 }
    )
  }

  return NextResponse.json({
    ok: true,
    data: serializeUserRecord(updatedUser),
  })
}

function toActivityRow(
  userId: string,
  d: StravaActivityDetail
): Prisma.StravaActivityCreateManyInput {
  return {
    userId,
    stravaActivityId: d.id,
    title: d.title,
    sportType: d.sportType,
    distanceMeters: d.distanceMeters,
    movingTimeSeconds: d.movingTimeSeconds,
    elapsedTimeSeconds: d.elapsedTimeSeconds,
    elevationMeters: d.elevationMeters,
    calories: d.calories,
    pace: d.pace,
    location: d.location,
    kudosCount: d.kudosCount,
    commentsCount: d.commentsCount,
    achievements:
      d.achievements.length > 0
        ? (d.achievements as Prisma.InputJsonValue)
        : undefined,
    description: d.description,
    hasMap: d.mapUrl != null,
    mapUrl: d.mapUrl,
    activityUrl: d.activityUrl,
  }
}
