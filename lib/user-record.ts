import type { LinkedInProfile } from "@/lib/linkedin"
import type { KrafmanCompanyProfile } from "@/lib/krafman.types"
import type { StravaProfile } from "@/lib/strava"

/** Persisted JSON shape for `active_company` — company linked for Krafman scraping. */
export interface ActiveCompanyEngagement {
  readonly companyName: string
  readonly roles: readonly string[]
  readonly registrationYear: number | null
  readonly orgNumber: string | null
  readonly krafmanUrl: string | null
}
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

export interface GithubRepoSummary {
  readonly name: string
  readonly full_name: string
  readonly html_url: string
  readonly description: string | null
  readonly stargazers_count: number
  readonly language: string | null
  readonly fork: boolean
  readonly archived: boolean
  readonly pushed_at: string | null
  readonly updated_at: string
}

/** GitHub profile built from REST API user + repos (same public data as the profile page). */
export interface UserGithubProfile {
  readonly login: string
  readonly github_numeric_id: number
  readonly node_id?: string
  readonly avatar_url: string
  readonly html_url: string
  readonly gravatar_id: string | null
  readonly name: string | null
  readonly company: string | null
  readonly blog: string | null
  readonly location: string | null
  readonly email: string | null
  readonly bio: string | null
  readonly twitter_username: string | null
  readonly hireable: boolean | null
  readonly type: string
  readonly site_admin: boolean
  readonly public_repos: number
  readonly public_gists: number
  readonly followers: number
  readonly following: number
  readonly created_at: string
  readonly updated_at: string
  readonly repos: readonly GithubRepoSummary[]
  /** Full GET /users/:login JSON for any extra fields GitHub returns. */
  readonly api_user: Readonly<Record<string, unknown>>
  readonly last_synced_at: string | null
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
  readonly activeCompany: ActiveCompanyEngagement | null
  readonly krafman: KrafmanCompanyProfile | null
  readonly twitter: UserTwitterProfile | null
  readonly twitterUsername: string | null
  readonly twitterFetchedAt: string | null
  readonly github: UserGithubProfile | null
  readonly githubUsername: string | null
  readonly githubFetchedAt: string | null
  readonly breach: BreachSearchResult | null
  readonly updatedAt: string
}

export type UserRecordPatch = {
  readonly person?: UserPerson | null
  readonly linkedin?: LinkedInProfile | null
  readonly linkedinUrl?: string | null
  readonly strava?: StravaProfile | null
  readonly activeCompany?: ActiveCompanyEngagement | null
  readonly krafman?: KrafmanCompanyProfile | null
  readonly twitter?: UserTwitterProfile | null
  readonly twitterUsername?: string | null
  readonly github?: UserGithubProfile | null
  readonly githubUsername?: string | null
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
