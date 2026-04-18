import type { LinkedInProfile } from "@/lib/linkedin"
import type { KrafmanCompanyProfile } from "@/lib/krafman.types"
import type { MrkollCompanyEngagement, MrkollProfile } from "@/lib/mrkoll.types"
import type { StravaProfile } from "@/lib/strava"
import type { BreachSearchResult } from "@/lib/breach"
import personData from "@/data/mock/person.json"

export interface UserPerson {
  readonly source: string
  readonly name: string
  readonly email: string
  readonly phone: string
  readonly city: string
  readonly state: string
  readonly country: string
  readonly zip: string
  readonly website: string
}

export interface UserTwitterTweet {
  readonly id: string
  readonly text: string
  readonly posted_at: string
  readonly likes: number
  readonly retweets: number
  readonly replies: number
  readonly views: number
  readonly is_retweet: boolean
}

export interface UserTwitterProfile {
  readonly handle: string
  readonly name: string
  readonly bio: string
  readonly location: string
  readonly website: string
  readonly joined: string
  readonly verified: boolean
  readonly blue_verified: boolean
  readonly followers: number
  readonly following: number
  readonly tweets_count: number
  readonly likes_count: number
  readonly avatar_url: string | null
  readonly recent_tweets: ReadonlyArray<UserTwitterTweet>
  readonly top_topics: ReadonlyArray<string>
  readonly profile_url: string
  readonly last_synced_at: string | null | undefined
}

export type UserRecordData = {
  readonly id: string
  readonly name: string
  readonly person: UserPerson | null
  readonly linkedinUrl: string | null
  readonly linkedin: LinkedInProfile | null
  readonly strava: StravaProfile | null
  readonly mrkoll: MrkollProfile | null
  readonly activeCompany: MrkollCompanyEngagement | null
  readonly krafman: KrafmanCompanyProfile | null
  readonly twitter: UserTwitterProfile | null
  readonly twitterUsername: string | null
  readonly twitterFetchedAt: string | null
  readonly breach: BreachSearchResult | null
  readonly updatedAt: string
}

export type UserRecordPatch = {
  readonly person?: UserPerson | null
  readonly linkedin?: LinkedInProfile | null
  readonly linkedinUrl?: string | null
  readonly strava?: StravaProfile | null
  readonly mrkoll?: MrkollProfile | null
  readonly activeCompany?: MrkollCompanyEngagement | null
  readonly krafman?: KrafmanCompanyProfile | null
  readonly twitter?: UserTwitterProfile | null
  readonly twitterUsername?: string | null
  readonly breach?: BreachSearchResult | null
}

export function buildDefaultPerson(name: string): UserPerson {
  return {
    ...personData,
    name,
  }
}

export function extractTwitterUsername(
  profile: UserTwitterProfile | null,
  explicitUsername?: string | null
): string {
  if (explicitUsername?.trim()) {
    return explicitUsername.trim().replace(/^@+/, "")
  }

  const handle = profile?.handle?.trim()
  if (handle) {
    return handle.replace(/^@+/, "")
  }

  const profileUrl = profile?.profile_url?.trim()
  if (!profileUrl) {
    return ""
  }

  const match = profileUrl.match(/(?:twitter|x)\.com\/([^/?#]+)/i)
  return match?.[1] ?? ""
}
