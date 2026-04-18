import type { UserTwitterProfile } from "@/lib/user-record"
import {
  fetchTwitterProfileAndTweetsScrape,
  searchTwitterUsersScrape,
} from "@/lib/twitter-scrape-sync"

const TWITTER_V1_BASE_URL = "https://api.x.com/1.1"
const TWITTER_V2_BASE_URL = "https://api.x.com/2"

interface TwitterV1UserResponse {
  readonly id_str: string
  readonly name: string
  readonly screen_name: string
  readonly description: string
  readonly location: string
  readonly created_at: string
  readonly verified: boolean
  readonly followers_count: number
  readonly friends_count: number
  readonly statuses_count: number
  readonly favourites_count: number
  readonly profile_image_url_https?: string
  readonly url?: string | null
  readonly entities?: {
    readonly url?: {
      readonly urls?: ReadonlyArray<{
        readonly expanded_url?: string
      }>
    }
  }
}

interface TwitterV1SearchUser {
  readonly id_str: string
  readonly name: string
  readonly screen_name: string
  readonly description?: string
  readonly profile_image_url_https?: string
}

interface TwitterV2UserTweetsResponse {
  readonly data?: ReadonlyArray<{
    readonly id: string
    readonly text: string
    readonly created_at: string
    readonly public_metrics?: {
      readonly like_count?: number
      readonly retweet_count?: number
      readonly reply_count?: number
      readonly impression_count?: number
    }
    readonly referenced_tweets?: ReadonlyArray<{
      readonly id: string
      readonly type: "retweeted" | "quoted" | "replied_to"
    }>
    readonly entities?: {
      readonly hashtags?: ReadonlyArray<{
        readonly tag: string
      }>
    }
    readonly context_annotations?: ReadonlyArray<{
      readonly domain?: { readonly name?: string }
      readonly entity?: { readonly name?: string }
    }>
  }>
}

export interface TwitterApiTweetRecord {
  readonly twitterTweetId: string
  readonly twitterAuthorId: string
  readonly text: string
  readonly postedAt: Date
  readonly likes: number
  readonly retweets: number
  readonly replies: number
  readonly views: number
  readonly isRetweet: boolean
  readonly isReply: boolean
  readonly raw: unknown
}

export interface TwitterSyncPayload {
  readonly twitterUserId: string
  readonly twitterUsername: string
  readonly profile: UserTwitterProfile
  readonly tweets: readonly TwitterApiTweetRecord[]
}

/** Row from X account search (v1.1 users/search). */
export interface TwitterSearchResult {
  readonly screenName: string
  readonly name: string
  readonly description: string
  readonly profileImageUrl: string | null
}

function hasTwitterCookieAuth(): boolean {
  return Boolean(
    process.env.TWITTER_AUTH_TOKEN?.trim() &&
      process.env.TWITTER_CT0?.trim()
  )
}

function getTwitterBearerToken(): string {
  const token =
    process.env.TWITTER_BEARER_TOKEN ?? process.env.X_BEARER_TOKEN ?? null

  if (!token) {
    throw new Error(
      "Missing credentials for X: set TWITTER_AUTH_TOKEN and TWITTER_CT0 (scraping), " +
        "or TWITTER_BEARER_TOKEN / X_BEARER_TOKEN (official API) in .env.local."
    )
  }

  return token
}

async function fetchTwitterJson<T>(
  url: string,
  label: string
): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${getTwitterBearerToken()}`,
    },
    cache: "no-store",
  })

  const payload = (await response.json().catch(() => null)) as
    | Record<string, unknown>
    | null

  if (!response.ok) {
    const errorMessage =
      typeof payload?.detail === "string"
        ? payload.detail
        : typeof payload?.title === "string"
          ? payload.title
          : `Request failed with status ${response.status}`

    throw new Error(`Failed to load ${label} from X API. ${errorMessage}`)
  }

  return payload as T
}

export function normalizeTwitterUsername(value: string): string {
  return value
    .trim()
    .replace(/^@+/, "")
    .replace(/^https?:\/\/(www\.)?(twitter|x)\.com\//i, "")
    .split(/[/?#]/)[0]
}

/**
 * Keyword search for X accounts — uses cookie-based scraping when
 * TWITTER_AUTH_TOKEN + TWITTER_CT0 are set; otherwise legacy v1.1 API (bearer token).
 */
export async function searchTwitterUsers(
  rawQuery: string,
  limit: number = 15
): Promise<readonly TwitterSearchResult[]> {
  if (hasTwitterCookieAuth()) {
    return searchTwitterUsersScrape(rawQuery, limit)
  }

  const q = rawQuery.trim()
  if (!q) {
    throw new Error("Enter a search query.")
  }

  const url = new URL(`${TWITTER_V1_BASE_URL}/users/search.json`)
  url.searchParams.set("q", q)
  url.searchParams.set("count", String(Math.min(Math.max(limit, 1), 20)))

  const rows = await fetchTwitterJson<TwitterV1SearchUser[]>(
    url.toString(),
    "account search"
  )

  if (!Array.isArray(rows)) {
    throw new Error("Unexpected response when searching X accounts.")
  }

  return rows.map((user) => ({
    screenName: user.screen_name,
    name: user.name,
    description: user.description ?? "",
    profileImageUrl: user.profile_image_url_https ?? null,
  }))
}

function buildTopTopics(
  tweets: TwitterV2UserTweetsResponse["data"]
): readonly string[] {
  const counts = new Map<string, number>()

  for (const tweet of tweets ?? []) {
    for (const hashtag of tweet.entities?.hashtags ?? []) {
      const key = hashtag.tag.trim().toLowerCase()
      if (key) counts.set(key, (counts.get(key) ?? 0) + 3)
    }

    for (const annotation of tweet.context_annotations ?? []) {
      const entityName = annotation.entity?.name?.trim().toLowerCase()
      if (entityName) counts.set(entityName, (counts.get(entityName) ?? 0) + 1)
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 6)
    .map(([topic]) => topic)
}

export async function fetchTwitterProfileAndTweets(
  rawUsername: string,
  limit: number = 12
): Promise<TwitterSyncPayload> {
  if (hasTwitterCookieAuth()) {
    return fetchTwitterProfileAndTweetsScrape(rawUsername, limit)
  }

  const twitterUsername = normalizeTwitterUsername(rawUsername)
  if (!twitterUsername) {
    throw new Error("Enter a valid X username.")
  }

  const userUrl = new URL(`${TWITTER_V1_BASE_URL}/users/show.json`)
  userUrl.searchParams.set("screen_name", twitterUsername)
  userUrl.searchParams.set("include_entities", "true")

  const twitterUser = await fetchTwitterJson<TwitterV1UserResponse>(
    userUrl.toString(),
    "profile"
  )

  const tweetsUrl = new URL(
    `${TWITTER_V2_BASE_URL}/users/${twitterUser.id_str}/tweets`
  )
  tweetsUrl.searchParams.set("max_results", String(Math.min(limit, 100)))
  tweetsUrl.searchParams.set(
    "tweet.fields",
    [
      "context_annotations",
      "created_at",
      "entities",
      "public_metrics",
      "referenced_tweets",
    ].join(",")
  )

  const tweetsResponse = await fetchTwitterJson<TwitterV2UserTweetsResponse>(
    tweetsUrl.toString(),
    "tweets"
  )

  const recentTweets = (tweetsResponse.data ?? []).map((tweet) => {
    const publicMetrics = tweet.public_metrics
    const isRetweet =
      tweet.referenced_tweets?.some((item) => item.type === "retweeted") ?? false
    const isReply =
      tweet.referenced_tweets?.some((item) => item.type === "replied_to") ?? false

    return {
      twitterTweetId: tweet.id,
      twitterAuthorId: twitterUser.id_str,
      text: tweet.text,
      postedAt: new Date(tweet.created_at),
      likes: publicMetrics?.like_count ?? 0,
      retweets: publicMetrics?.retweet_count ?? 0,
      replies: publicMetrics?.reply_count ?? 0,
      views: publicMetrics?.impression_count ?? 0,
      isRetweet,
      isReply,
      raw: tweet,
    }
  })

  const website =
    twitterUser.entities?.url?.urls?.[0]?.expanded_url ??
    twitterUser.url ??
    ""

  return {
    twitterUserId: twitterUser.id_str,
    twitterUsername,
    profile: {
      handle: `@${twitterUser.screen_name}`,
      name: twitterUser.name,
      bio: twitterUser.description ?? "",
      location: twitterUser.location ?? "",
      website,
      joined: new Date(twitterUser.created_at).toISOString(),
      verified: twitterUser.verified,
      blue_verified: false,
      followers: twitterUser.followers_count ?? 0,
      following: twitterUser.friends_count ?? 0,
      tweets_count: twitterUser.statuses_count ?? 0,
      likes_count: twitterUser.favourites_count ?? 0,
      avatar_url: twitterUser.profile_image_url_https ?? null,
      recent_tweets: recentTweets.map((tweet) => ({
        id: tweet.twitterTweetId,
        text: tweet.text,
        posted_at: tweet.postedAt.toISOString(),
        likes: tweet.likes,
        retweets: tweet.retweets,
        replies: tweet.replies,
        views: tweet.views,
        is_retweet: tweet.isRetweet,
      })),
      top_topics: buildTopTopics(tweetsResponse.data),
      profile_url: `https://x.com/${twitterUser.screen_name}`,
      last_synced_at: new Date().toISOString(),
    },
    tweets: recentTweets,
  }
}
