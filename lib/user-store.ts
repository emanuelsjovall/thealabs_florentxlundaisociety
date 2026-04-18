import { Prisma } from "@prisma/client"
import type {
  UserGithubProfile,
  UserRecordData,
  UserTwitterProfile,
} from "@/lib/user-record"
import type { StravaActivity, StravaProfile, StravaSportType } from "@/lib/strava"

const twitterTweetSelect = {
  twitterTweetId: true,
  text: true,
  postedAt: true,
  likes: true,
  retweets: true,
  replies: true,
  views: true,
  isRetweet: true,
} as const

const stravaActivitySelect = {
  stravaActivityId: true,
  title: true,
  sportType: true,
  distanceMeters: true,
  movingTimeSeconds: true,
  elapsedTimeSeconds: true,
  elevationMeters: true,
  calories: true,
  pace: true,
  location: true,
  kudosCount: true,
  commentsCount: true,
  achievements: true,
  description: true,
  hasMap: true,
  mapUrl: true,
  activityUrl: true,
  createdAt: true,
} as const

export const userSelect = {
  id: true,
  name: true,
  person: true,
  linkedinUrl: true,
  linkedin: true,
  strava: true,
  stravaAthleteId: true,
  stravaFetchedAt: true,
  activeCompany: true,
  krafman: true,
  twitter: true,
  github: true,
  breach: true,
  twitterUsername: true,
  twitterFetchedAt: true,
  githubUsername: true,
  githubFetchedAt: true,
  twitterTweets: {
    orderBy: { postedAt: "desc" },
    take: 12,
    select: twitterTweetSelect,
  },
  stravaActivities: {
    orderBy: { createdAt: "desc" },
    select: stravaActivitySelect,
  },
  notes: {
    orderBy: { updatedAt: "desc" },
    select: { id: true, content: true, createdAt: true, updatedAt: true },
  },
  updatedAt: true,
} satisfies Prisma.UserSelect

type UserWithTwitterCache = Prisma.UserGetPayload<{ select: typeof userSelect }>

export function toJsonInput(
  value: unknown | null | undefined
): Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined {
  if (value === undefined) return undefined
  if (value === null) return Prisma.JsonNull

  return value as Prisma.InputJsonValue
}

function serializeGithubProfile(
  github: UserWithTwitterCache["github"],
  githubUsername: string | null,
  githubFetchedAt: Date | null
): UserGithubProfile | null {
  if (!github) {
    return null
  }

  const base = github as unknown as UserGithubProfile
  return {
    ...base,
    login: base.login || githubUsername || "",
    last_synced_at:
      githubFetchedAt?.toISOString() ?? base.last_synced_at ?? null,
  }
}

function serializeTwitterProfile(
  twitter: UserWithTwitterCache["twitter"],
  tweets: UserWithTwitterCache["twitterTweets"],
  twitterUsername: string | null,
  twitterFetchedAt: Date | null
): UserTwitterProfile | null {
  if (!twitter) {
    return null
  }

  const baseProfile = twitter as unknown as UserTwitterProfile
  const recentTweets =
    tweets.length > 0
      ? tweets.map((tweet) => ({
          id: tweet.twitterTweetId,
          text: tweet.text,
          posted_at: tweet.postedAt.toISOString(),
          likes: tweet.likes,
          retweets: tweet.retweets,
          replies: tweet.replies,
          views: tweet.views,
          is_retweet: tweet.isRetweet,
        }))
      : baseProfile.recent_tweets ?? []

  return {
    ...baseProfile,
    handle:
      baseProfile.handle ||
      (twitterUsername ? `@${twitterUsername.replace(/^@+/, "")}` : ""),
    recent_tweets: recentTweets,
    top_topics: baseProfile.top_topics ?? [],
    last_synced_at: twitterFetchedAt?.toISOString() ?? null,
  }
}

function serializeStravaProfile(
  strava: UserWithTwitterCache["strava"],
  dbActivities: UserWithTwitterCache["stravaActivities"],
  stravaAthleteId: string | null,
  stravaFetchedAt: Date | null
): StravaProfile | null {
  const baseProfile = strava as unknown as StravaProfile | null

  // Build activities from DB rows if available, else fall back to JSON blob
  const activities: StravaActivity[] =
    dbActivities.length > 0
      ? dbActivities.map((row) => ({
          id: row.stravaActivityId,
          title: row.title,
          sportType: row.sportType as StravaSportType,
          datetime: row.createdAt.toISOString(),
          distanceMeters: row.distanceMeters,
          movingTimeSeconds: row.movingTimeSeconds,
          elapsedTimeSeconds: row.elapsedTimeSeconds,
          elevationMeters: row.elevationMeters,
          hasMap: row.hasMap,
          mapUrl: row.mapUrl,
          activityUrl: row.activityUrl,
          location: row.location,
          calories: row.calories,
          pace: row.pace,
          kudosCount: row.kudosCount,
          commentsCount: row.commentsCount,
          achievements: row.achievements as string[] | null,
          description: row.description,
        }))
      : (baseProfile?.activities as StravaActivity[]) ?? []

  if (!baseProfile && !stravaAthleteId) {
    return null
  }

  return {
    athleteId: baseProfile?.athleteId ?? stravaAthleteId ?? "",
    name: baseProfile?.name ?? null,
    profileImageUrl: baseProfile?.profileImageUrl ?? null,
    totalActivities: activities.length,
    activities,
  }
}

export function serializeUserRecord(user: UserWithTwitterCache): UserRecordData {
  return {
    id: user.id,
    name: user.name,
    person: user.person as UserRecordData["person"],
    linkedin: user.linkedin as UserRecordData["linkedin"],
    linkedinUrl: user.linkedinUrl,
    strava: serializeStravaProfile(
      user.strava,
      user.stravaActivities,
      user.stravaAthleteId,
      user.stravaFetchedAt
    ),
    activeCompany: user.activeCompany as UserRecordData["activeCompany"],
    krafman: user.krafman as UserRecordData["krafman"],
    twitter: serializeTwitterProfile(
      user.twitter,
      user.twitterTweets,
      user.twitterUsername,
      user.twitterFetchedAt
    ),
    twitterUsername: user.twitterUsername,
    twitterFetchedAt: user.twitterFetchedAt?.toISOString() ?? null,
    github: serializeGithubProfile(
      user.github,
      user.githubUsername,
      user.githubFetchedAt
    ),
    githubUsername: user.githubUsername,
    githubFetchedAt: user.githubFetchedAt?.toISOString() ?? null,
    breach: user.breach as UserRecordData["breach"],
    notes: user.notes.map((n) => ({
      id: n.id,
      content: n.content,
      createdAt: n.createdAt.toISOString(),
      updatedAt: n.updatedAt.toISOString(),
    })),
    updatedAt: user.updatedAt.toISOString(),
  }
}
