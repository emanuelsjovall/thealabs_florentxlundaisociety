import type { LinkedInExperience, LinkedInEducation, LinkedInPost } from "@/lib/linkedin/linkedin-profile.types"
import type { StravaActivity } from "@/lib/strava/strava.types"
import type { UserTwitterTweet } from "@/lib/user-record"

export type { LinkedInExperience, LinkedInEducation, LinkedInPost, StravaActivity, UserTwitterTweet }

export type TimelineEvent =
  | {
      kind: "linkedin-experience"
      id: string
      startDate: Date
      endDate: Date | null
      label: string
      sublabel: string | null
      payload: LinkedInExperience
    }
  | {
      kind: "linkedin-education"
      id: string
      startDate: Date
      endDate: Date | null
      label: string
      sublabel: string | null
      payload: LinkedInEducation
    }
  | {
      kind: "linkedin-post"
      id: string
      startDate: Date
      endDate: null
      label: string
      sublabel: null
      payload: LinkedInPost
    }
  | {
      kind: "strava-activity"
      id: string
      startDate: Date
      endDate: null
      label: string
      sublabel: string
      payload: StravaActivity
    }
  | {
      kind: "twitter-tweet"
      id: string
      startDate: Date
      endDate: null
      label: string
      sublabel: null
      payload: UserTwitterTweet
    }

export type TimelineCluster = {
  id: string
  events: TimelineEvent[]
  spanStartX: number
  spanEndX: number
  centerX: number
}
