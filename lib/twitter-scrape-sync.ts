import type { Tweet } from "@the-convocation/twitter-scraper"
import { createAuthenticatedScraper } from "@/lib/scrape-twitter"
import type {
  TwitterApiTweetRecord,
  TwitterSearchResult,
  TwitterSyncPayload,
} from "@/lib/twitter-api"

function normalizeTwitterUsername(value: string): string {
  return value
    .trim()
    .replace(/^@+/, "")
    .replace(/^https?:\/\/(www\.)?(twitter|x)\.com\//i, "")
    .split(/[/?#]/)[0]
}

async function collectAsync<T>(
  generator: AsyncGenerator<T>,
  limit: number
): Promise<readonly T[]> {
  const results: T[] = []
  for await (const item of generator) {
    results.push(item)
    if (results.length >= limit) break
  }
  return results
}

/** Bearers used by x.com web / api.x.com (twitter-scraper bundles both). */
const TWITTER_WEB_BEARER_PRIMARY =
  "AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA"
const TWITTER_WEB_BEARER_ALT =
  "AAAAAAAAAAAAAAAAAAAAAFQODgEAAAAAVHTp76lzh3rFzcHbmHVvQxYYpTw%3DckAlMINMjmCwxUcaXbAN4XqJVdgMJaHqNOFgPMK0zN1qLqLQCF"

function typeaheadCookies(): { authToken: string; ct0: string } | null {
  const authToken = process.env.TWITTER_AUTH_TOKEN?.trim()
  const ct0 = process.env.TWITTER_CT0?.trim()
  if (!authToken || !ct0) return null
  return { authToken, ct0 }
}

function extractTypeaheadBio(row: Record<string, unknown>): string {
  const flat =
    typeof row.description === "string"
      ? row.description
      : typeof row.profile_bio === "string"
        ? row.profile_bio
        : ""
  if (flat) return flat
  const status = row.status
  if (status && typeof status === "object") {
    const st = status as Record<string, unknown>
    if (typeof st.text === "string") return st.text
  }
  return ""
}

function parseTypeaheadUsers(payload: unknown): TwitterSearchResult[] {
  if (!payload || typeof payload !== "object") return []
  const root = payload as Record<string, unknown>

  const candidates: unknown[] = []
  if (Array.isArray(root.users)) candidates.push(...root.users)
  if (Array.isArray(root.filtered_users)) candidates.push(...root.filtered_users)

  const seen = new Set<string>()
  const out: TwitterSearchResult[] = []

  for (const item of candidates) {
    if (!item || typeof item !== "object") continue
    const row = item as Record<string, unknown>
    const screen =
      typeof row.screen_name === "string"
        ? row.screen_name
        : typeof row.screenName === "string"
          ? row.screenName
          : ""
    if (!screen || seen.has(screen)) continue
    seen.add(screen)

    const name =
      typeof row.name === "string"
        ? row.name
        : typeof row.display_name === "string"
          ? row.display_name
          : screen

    const profileImageUrl =
      typeof row.profile_image_url_https === "string"
        ? row.profile_image_url_https
        : typeof row.profile_image_url === "string"
          ? row.profile_image_url
          : null

    out.push({
      screenName: screen,
      name,
      description: extractTypeaheadBio(row),
      profileImageUrl,
    })
  }

  return out
}

/**
 * Same endpoint family as the X search box dropdown (not GraphQL People tab).
 */
async function searchUsersTypeahead(query: string): Promise<TwitterSearchResult[]> {
  const cookies = typeaheadCookies()
  if (!cookies) return []

  const variants: URLSearchParams[] = [
    new URLSearchParams({
      q: query,
      src: "search_box",
      result_type: "events,users,topics,lists",
    }),
    new URLSearchParams({
      q: query,
      src: "search_box",
      result_type: "filtered_users,users,topics",
    }),
  ]

  const hosts = [
    "https://twitter.com/i/api/1.1/search/typeahead.json",
    "https://x.com/i/api/1.1/search/typeahead.json",
    "https://twitter.com/i/api/2/search/typeahead.json",
    "https://api.x.com/1.1/search/typeahead.json",
  ]

  const bearers = [TWITTER_WEB_BEARER_PRIMARY, TWITTER_WEB_BEARER_ALT]

  for (const params of variants) {
    for (const base of hosts) {
      const url = `${base}?${params.toString()}`
      for (const bearer of bearers) {
        try {
          const res = await fetch(url, {
            headers: {
              Authorization: `Bearer ${bearer}`,
              Cookie: `auth_token=${cookies.authToken}; ct0=${cookies.ct0}`,
              "x-csrf-token": cookies.ct0,
              "x-twitter-auth-type": "OAuth2Session",
              "x-twitter-active-user": "yes",
              Referer: "https://x.com/",
              "Accept-Language": "en-US,en;q=0.9",
              "User-Agent":
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            },
            cache: "no-store",
          })
          if (!res.ok) continue
          const json: unknown = await res.json()
          const rows = parseTypeaheadUsers(json)
          if (rows.length > 0) return rows
        } catch {
          continue
        }
      }
    }
  }

  return []
}

function buildTopTopicsFromTweets(tweets: readonly Tweet[]): readonly string[] {
  const counts = new Map<string, number>()

  for (const tweet of tweets) {
    for (const tag of tweet.hashtags ?? []) {
      const key = tag.trim().toLowerCase()
      if (key) counts.set(key, (counts.get(key) ?? 0) + 3)
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 6)
    .map(([topic]) => topic)
}

export async function fetchTwitterProfileAndTweetsScrape(
  rawUsername: string,
  limit: number = 12
): Promise<TwitterSyncPayload> {
  const twitterUsername = normalizeTwitterUsername(rawUsername)
  if (!twitterUsername) {
    throw new Error("Enter a valid X username.")
  }

  const scraper = await createAuthenticatedScraper()

  try {
    const profile = await scraper.getProfile(twitterUsername)
    const resolvedUserId = profile.userId
    if (!resolvedUserId) {
      throw new Error(`User "${twitterUsername}" not found.`)
    }

    const tweets = await collectAsync(
      scraper.getTweets(twitterUsername, limit),
      limit
    )

    const resolvedHandle = profile.username ?? twitterUsername

    const tweetRecords: TwitterApiTweetRecord[] = tweets.map((tweet) => ({
      twitterTweetId: tweet.id ?? "",
      twitterAuthorId: tweet.userId ?? resolvedUserId,
      text: tweet.text ?? "",
      postedAt: tweet.timeParsed ?? new Date(0),
      likes: tweet.likes ?? 0,
      retweets: tweet.retweets ?? 0,
      replies: tweet.replies ?? 0,
      views: tweet.views ?? 0,
      isRetweet: tweet.isRetweet ?? false,
      isReply: tweet.isReply ?? false,
      raw: tweet,
    }))

    const website = profile.website ?? profile.url ?? ""

    return {
      twitterUserId: resolvedUserId,
      twitterUsername: resolvedHandle,
      profile: {
        handle: `@${resolvedHandle}`,
        name: profile.name ?? "",
        bio: profile.biography ?? "",
        location: profile.location ?? "",
        website,
        joined: profile.joined?.toISOString() ?? new Date(0).toISOString(),
        verified: profile.isVerified ?? false,
        blue_verified: profile.isBlueVerified ?? false,
        followers: profile.followersCount ?? 0,
        following: profile.friendsCount ?? profile.followingCount ?? 0,
        tweets_count: profile.statusesCount ?? profile.tweetsCount ?? 0,
        likes_count: profile.likesCount ?? 0,
        avatar_url: profile.avatar ?? null,
        recent_tweets: tweetRecords.map((tweet) => ({
          id: tweet.twitterTweetId,
          text: tweet.text,
          posted_at: tweet.postedAt.toISOString(),
          likes: tweet.likes,
          retweets: tweet.retweets,
          replies: tweet.replies,
          views: tweet.views,
          is_retweet: tweet.isRetweet,
        })),
        top_topics: buildTopTopicsFromTweets(tweets),
        profile_url: `https://x.com/${resolvedHandle}`,
        last_synced_at: new Date().toISOString(),
      },
      tweets: tweetRecords,
    }
  } finally {
    await scraper.logout()
  }
}

export async function searchTwitterUsersScrape(
  rawQuery: string,
  limit: number = 15
): Promise<readonly TwitterSearchResult[]> {
  const q = rawQuery.trim()
  if (!q) {
    throw new Error("Enter a search query.")
  }

  const cap = Math.min(Math.max(limit, 1), 20)

  const fromTypeahead = await searchUsersTypeahead(q)
  if (fromTypeahead.length > 0) {
    return fromTypeahead.slice(0, cap)
  }

  const scraper = await createAuthenticatedScraper()

  try {
    const profiles = await collectAsync(
      scraper.searchProfiles(q, cap),
      cap
    )

    return profiles
      .map((profile) => ({
        screenName: profile.username ?? "",
        name: profile.name ?? "",
        description: profile.biography ?? "",
        profileImageUrl: profile.avatar ?? null,
      }))
      .filter((row) => row.screenName.length > 0)
  } finally {
    await scraper.logout()
  }
}
