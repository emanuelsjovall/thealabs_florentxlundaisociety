import { Prisma } from "@prisma/client"
import type {
  UserGithubProfile,
  UserRecordData,
  UserTwitterProfile,
} from "@/lib/user-record"

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

export const userSelect = {
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

export function serializeUserRecord(user: UserWithTwitterCache): UserRecordData {
  return {
    id: user.id,
    name: user.name,
    person: user.person as UserRecordData["person"],
    linkedin: user.linkedin as UserRecordData["linkedin"],
    linkedinUrl: user.linkedinUrl,
    strava: user.strava as UserRecordData["strava"],
    mrkoll: user.mrkoll as UserRecordData["mrkoll"],
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
    updatedAt: user.updatedAt.toISOString(),
  }
}
