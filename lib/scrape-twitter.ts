import { Scraper } from "@the-convocation/twitter-scraper"
import type { Tweet, Profile } from "@the-convocation/twitter-scraper"

// ── Types ───────────────────────────────────────────────────────

type TweetKind = "original" | "retweet" | "quote" | "reply"

interface TweetMetrics {
  readonly viewCount: number | null
  readonly quoteCount: number | null
  readonly likeCount: number | null
  readonly replyCount: number | null
  readonly retweetCount: number | null
  readonly bookmarkCount: number | null
}

interface ReferencedTweet {
  readonly id: string | null
  readonly user: string | null
  readonly text: string | null
}

interface ScrapedTweet {
  readonly tweetId: string
  readonly user: string
  readonly createdAt: string
  readonly postText: string
  readonly metrics: TweetMetrics
  readonly kind: TweetKind
  readonly replyTo: ReferencedTweet | null
  readonly originalTweet: ReferencedTweet | null
  readonly isMutualFollowership: boolean
}

interface ScrapeResult {
  readonly username: string
  readonly scrapedAt: string
  readonly tweetCount: number
  readonly tweets: readonly ScrapedTweet[]
}

// ── Scraper session ─────────────────────────────────────────────

/**
 * Creates an authenticated Scraper using browser cookies from env vars.
 *
 * Twitter blocks automated login from servers, so we use cookies instead.
 * Extract `auth_token` and `ct0` from your browser after logging in to x.com.
 */
export async function createAuthenticatedScraper(): Promise<Scraper> {
  const authToken = process.env.TWITTER_AUTH_TOKEN
  const ct0 = process.env.TWITTER_CT0

  if (!authToken || !ct0) {
    throw new Error(
      "Missing Twitter cookies. " +
        "Set TWITTER_AUTH_TOKEN and TWITTER_CT0 in .env.local. " +
        "Extract them from your browser after logging in to x.com."
    )
  }

  const scraper = new Scraper()
  await scraper.setCookies([
    `auth_token=${authToken}; Domain=.x.com; Path=/; Secure; HttpOnly`,
    `ct0=${ct0}; Domain=.x.com; Path=/; Secure`,
  ])

  const loggedIn = await scraper.isLoggedIn()
  if (!loggedIn) {
    throw new Error(
      "Twitter authentication failed. Your cookies may have expired. " +
        "Re-extract auth_token and ct0 from your browser."
    )
  }

  return scraper
}

// ── Tweet classification ────────────────────────────────────────

function classifyTweet(tweet: Tweet): {
  readonly kind: TweetKind
  readonly replyTo: ReferencedTweet | null
  readonly originalTweet: ReferencedTweet | null
} {
  if (tweet.isRetweet && tweet.retweetedStatus) {
    return {
      kind: "retweet",
      replyTo: null,
      originalTweet: {
        id: tweet.retweetedStatus.id ?? null,
        user: tweet.retweetedStatus.username ?? null,
        text: tweet.retweetedStatus.text ?? null,
      },
    }
  }

  if (tweet.isQuoted && tweet.quotedStatus) {
    return {
      kind: "quote",
      replyTo: null,
      originalTweet: {
        id: tweet.quotedStatus.id ?? null,
        user: tweet.quotedStatus.username ?? null,
        text: tweet.quotedStatus.text ?? null,
      },
    }
  }

  if (tweet.isReply && tweet.inReplyToStatusId) {
    const ref: ReferencedTweet = {
      id: tweet.inReplyToStatusId,
      user: tweet.inReplyToStatus?.username ?? null,
      text: tweet.inReplyToStatus?.text ?? null,
    }
    return { kind: "reply", replyTo: ref, originalTweet: ref }
  }

  return { kind: "original", replyTo: null, originalTweet: null }
}

// ── Tweet transformation ────────────────────────────────────────

function toScrapedTweet(tweet: Tweet, isMutual: boolean): ScrapedTweet {
  const { kind, replyTo, originalTweet } = classifyTweet(tweet)

  return {
    tweetId: tweet.id ?? "",
    user: tweet.username ?? "",
    createdAt: tweet.timeParsed?.toISOString() ?? "",
    postText: tweet.text ?? "",
    metrics: {
      viewCount: tweet.views ?? null,
      quoteCount: null,
      likeCount: tweet.likes ?? null,
      replyCount: tweet.replies ?? null,
      retweetCount: tweet.retweets ?? null,
      bookmarkCount: tweet.bookmarkCount ?? null,
    },
    kind,
    replyTo,
    originalTweet,
    isMutualFollowership: isMutual,
  }
}

// ── Async collection helper ─────────────────────────────────────

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

// ── Main exported function ──────────────────────────────────────

const DEFAULT_TWEET_LIMIT = 100

/**
 * Scrapes tweets, replies, followers, and following for a Twitter user.
 * Authenticates using credentials from environment variables.
 */
async function scrapeTwitter(
  username: string,
  limit: number = DEFAULT_TWEET_LIMIT
): Promise<ScrapeResult> {
  const scraper = await createAuthenticatedScraper()

  try {
    const profile = await scraper.getProfile(username)
    const userId = profile.userId
    if (!userId) {
      throw new Error(`User "${username}" not found.`)
    }

    // Twitter rotates GraphQL endpoints -- any call can 404, so fail gracefully
    const [tweets, tweetsAndReplies, followers, following] = await Promise.all([
      collectAsync(scraper.getTweets(username, limit), limit).catch(
        () => [] as Tweet[]
      ),
      collectAsync(scraper.getTweetsAndReplies(username, limit), limit).catch(
        () => [] as Tweet[]
      ),
      collectAsync(scraper.getFollowers(userId, limit), limit).catch(
        () => [] as Profile[]
      ),
      collectAsync(scraper.getFollowing(userId, limit), limit).catch(
        () => [] as Profile[]
      ),
    ])

    const followerIds = new Set(
      followers.map((f: Profile) => f.userId).filter(Boolean)
    )
    const followingIds = new Set(
      following.map((f: Profile) => f.userId).filter(Boolean)
    )

    const tweetMap = new Map<string, Tweet>()
    for (const tweet of [...tweets, ...tweetsAndReplies]) {
      if (tweet.id) {
        tweetMap.set(tweet.id, tweet)
      }
    }

    const scrapedTweets: ScrapedTweet[] = []
    for (const tweet of tweetMap.values()) {
      const tweetUserId = tweet.userId
      const isMutual =
        tweetUserId != null &&
        followerIds.has(tweetUserId) &&
        followingIds.has(userId)

      scrapedTweets.push(toScrapedTweet(tweet, isMutual))
    }

    scrapedTweets.sort((a, b) => {
      const userCmp = a.user.localeCompare(b.user)
      if (userCmp !== 0) return userCmp
      return a.createdAt.localeCompare(b.createdAt)
    })

    return {
      username,
      scrapedAt: new Date().toISOString(),
      tweetCount: scrapedTweets.length,
      tweets: scrapedTweets,
    }
  } finally {
    await scraper.logout()
  }
}

export { scrapeTwitter }
export type {
  ScrapeResult,
  ScrapedTweet,
  TweetMetrics,
  TweetKind,
  ReferencedTweet,
}
