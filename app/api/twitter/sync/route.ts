import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  fetchTwitterProfileAndTweets,
  normalizeTwitterUsername,
} from "@/lib/twitter-api"
import { extractTwitterUsername, type UserTwitterProfile } from "@/lib/user-record"
import { serializeUserRecord, toJsonInput, userSelect } from "@/lib/user-store"

const TWITTER_CACHE_TTL_MS = 30 * 60 * 1000

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
      twitter: true,
      twitterUsername: true,
      twitterFetchedAt: true,
    },
  })

  if (!existingUser) {
    return NextResponse.json(
      { ok: false, error: "User not found" },
      { status: 404 }
    )
  }

  const username = normalizeTwitterUsername(
    body.username ??
      extractTwitterUsername(
        (existingUser.twitter as UserTwitterProfile | null) ?? null,
        existingUser.twitterUsername
      )
  )

  if (!username) {
    return NextResponse.json(
      { ok: false, error: "Enter an X username to load data for this user." },
      { status: 400 }
    )
  }

  const isFresh =
    !body.force &&
    existingUser.twitterFetchedAt != null &&
    Date.now() - existingUser.twitterFetchedAt.getTime() < TWITTER_CACHE_TTL_MS

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
    const twitterData = await fetchTwitterProfileAndTweets(username)

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          twitter: toJsonInput({
            ...twitterData.profile,
            recent_tweets: [],
          }),
          twitterUsername: twitterData.twitterUsername,
          twitterUserId: twitterData.twitterUserId,
          twitterFetchedAt: new Date(),
          updatedAt: new Date(),
        },
      }),
      prisma.twitterTweet.deleteMany({
        where: { userId },
      }),
      prisma.twitterTweet.createMany({
        data: twitterData.tweets.map((tweet) => ({
          userId,
          twitterTweetId: tweet.twitterTweetId,
          twitterAuthorId: tweet.twitterAuthorId,
          text: tweet.text,
          postedAt: tweet.postedAt,
          likes: tweet.likes,
          retweets: tweet.retweets,
          replies: tweet.replies,
          views: tweet.views,
          isRetweet: tweet.isRetweet,
          isReply: tweet.isReply,
          raw: toJsonInput(tweet.raw),
        })),
      }),
    ])

    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: userSelect,
    })

    if (!updatedUser) {
      return NextResponse.json(
        { ok: false, error: "User not found after syncing Twitter data" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ok: true,
      data: serializeUserRecord(updatedUser),
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load X profile"

    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    )
  }
}
