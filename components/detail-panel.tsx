"use client"

import { useState, type ReactNode } from "react"
import { X, Loader2, Search, MapPin, Mail, Phone, Globe } from "lucide-react"
import { cn } from "@/lib/utils"
import type { LinkedInProfile, LinkedInSearchResult } from "@/lib/linkedin"
import type {
  StravaProfile,
  StravaSearchResult,
  StravaActivity,
  StravaActivityDetail,
} from "@/lib/strava"
import type {
  MrkollSearchResult,
  MrkollProfile,
  MrkollCompanyEngagement,
} from "@/lib/mrkoll.types"
import type { KrafmanCompanyProfile } from "@/lib/krafman.types"
import type { UserTwitterProfile } from "@/lib/user-record"
import type { BreachSearchResult, BreachRecord } from "@/lib/breach"

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-[9px] tracking-[0.22em] text-neutral-700 uppercase">
        {label}
      </p>
      {children}
    </div>
  )
}

function Card({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-3.5">
      {children}
    </div>
  )
}

function LoadingSpinner({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20">
      <Loader2 className="h-5 w-5 animate-spin text-neutral-500" />
      <p className="text-xs text-neutral-600">{text}</p>
    </div>
  )
}

function DetailRow({
  icon: Icon,
  text,
}: {
  icon: typeof MapPin
  text: string
}) {
  return (
    <div className="flex items-center gap-2.5 text-sm text-neutral-400">
      <Icon className="h-3.5 w-3.5 shrink-0 text-neutral-600" />
      <span className="truncate">{text}</span>
    </div>
  )
}

/* ─── Search Bar ─── */

function SearchBar({
  initialQuery,
  placeholder,
  onSearch,
}: {
  initialQuery: string
  placeholder: string
  onSearch: (query: string) => void
}) {
  const [value, setValue] = useState(initialQuery)

  return (
    <div className="mb-4 flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2">
      <Search className="h-3.5 w-3.5 shrink-0 text-neutral-600" />
      <input
        className="flex-1 bg-transparent text-xs text-foreground placeholder:text-neutral-600 focus:outline-none"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && value.trim()) onSearch(value.trim())
        }}
      />
    </div>
  )
}

/* ─── LinkedIn Search Results ─── */

function LinkedInSearchResultsList({
  results,
  searchQuery,
  onSelect,
  onRetry,
}: {
  results: readonly LinkedInSearchResult[]
  searchQuery: string
  onSelect: (result: LinkedInSearchResult) => void
  onRetry: (query: string) => void
}) {
  return (
    <div className="space-y-1">
      <SearchBar
        initialQuery={searchQuery}
        placeholder="Search LinkedIn..."
        onSearch={onRetry}
      />
      {results.length === 0 ? (
        <p className="py-12 text-center text-xs text-neutral-600">
          No matches found
        </p>
      ) : (
        <p className="mb-4 text-[10px] text-neutral-600">
          {results.length} potential{" "}
          {results.length === 1 ? "match" : "matches"}
        </p>
      )}
      {results.map((result, i) => (
        <button
          key={i}
          onClick={() => onSelect(result)}
          className="flex w-full items-start gap-3 rounded-lg border border-transparent p-3 text-left transition-colors hover:border-neutral-800 hover:bg-neutral-900/60"
        >
          {result.profileImageUrl ? (
            <img
              src={result.profileImageUrl}
              alt=""
              className="h-10 w-10 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-800 text-xs text-neutral-500">
              {result.name.charAt(0)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm text-foreground">{result.name}</p>
              {result.connectionDegree && (
                <span className="shrink-0 text-[10px] text-neutral-600">
                  · {result.connectionDegree}
                </span>
              )}
            </div>
            {result.headline && (
              <p className="mt-0.5 line-clamp-1 text-xs text-neutral-500">
                {result.headline}
              </p>
            )}
          </div>
        </button>
      ))}
    </div>
  )
}

/* ─── Strava Search Results ─── */

function StravaSearchResultsList({
  results,
  searchQuery,
  onSelect,
  onRetry,
}: {
  results: readonly StravaSearchResult[]
  searchQuery: string
  onSelect: (result: StravaSearchResult) => void
  onRetry: (query: string) => void
}) {
  return (
    <div className="space-y-1">
      <SearchBar
        initialQuery={searchQuery}
        placeholder="Search Strava..."
        onSearch={onRetry}
      />
      {results.length === 0 ? (
        <p className="py-12 text-center text-xs text-neutral-600">
          No athletes found
        </p>
      ) : (
        <p className="mb-4 text-[10px] text-neutral-600">
          {results.length} potential{" "}
          {results.length === 1 ? "match" : "matches"}
        </p>
      )}
      {results.map((result, i) => (
        <button
          key={i}
          onClick={() => onSelect(result)}
          className="flex w-full items-start gap-3 rounded-lg border border-transparent p-3 text-left transition-colors hover:border-neutral-800 hover:bg-neutral-900/60"
        >
          {result.profileImageUrl ? (
            <img
              src={result.profileImageUrl}
              alt=""
              className="h-10 w-10 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-800 text-xs text-neutral-500">
              {result.name.charAt(0)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-foreground">{result.name}</p>
            {result.location && (
              <p className="mt-0.5 text-xs text-neutral-500">
                {result.location}
              </p>
            )}
          </div>
        </button>
      ))}
    </div>
  )
}

/* ─── LinkedIn Profile Content ─── */

function LinkedinProfileContent({ profile }: { profile: LinkedInProfile }) {
  const currentExp = profile.experiences[0]

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-light text-foreground">{profile.name}</h3>
        {profile.headline && (
          <p className="mt-1.5 text-sm leading-relaxed text-neutral-400">
            {profile.headline}
          </p>
        )}
        {profile.location && (
          <p className="mt-2.5 text-[11px] text-neutral-600">
            {profile.location}
          </p>
        )}
      </div>

      {profile.about && (
        <Section label="About">
          <p className="text-sm leading-relaxed text-neutral-400">
            {profile.about}
          </p>
        </Section>
      )}

      {currentExp && (
        <Section label="Current Position">
          <Card>
            <p className="text-sm text-foreground">
              {currentExp.positionTitle}
            </p>
            {currentExp.companyName && (
              <p className="mt-1 text-xs text-neutral-500">
                {currentExp.companyName}
              </p>
            )}
            <p className="mt-0.5 text-[11px] text-neutral-700">
              {[
                currentExp.location,
                currentExp.fromDate &&
                  `${currentExp.fromDate} – ${currentExp.toDate ?? "present"}`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </Card>
        </Section>
      )}

      {profile.experiences.length > 1 && (
        <Section label="Experience">
          <div className="space-y-2">
            {profile.experiences.slice(1).map((exp, i) => (
              <Card key={i}>
                <p className="text-sm text-foreground">{exp.positionTitle}</p>
                {exp.companyName && (
                  <p className="mt-1 text-xs text-neutral-500">
                    {exp.companyName}
                  </p>
                )}
                <p className="mt-0.5 text-[11px] text-neutral-700">
                  {[exp.location, exp.duration].filter(Boolean).join(" · ")}
                </p>
              </Card>
            ))}
          </div>
        </Section>
      )}

      {profile.educations.length > 0 && (
        <Section label="Education">
          <div className="space-y-2">
            {profile.educations.map((edu, i) => (
              <Card key={i}>
                <p className="text-sm text-foreground">{edu.institutionName}</p>
                {(edu.degree || edu.fieldOfStudy) && (
                  <p className="mt-1 text-xs text-neutral-500">
                    {[edu.degree, edu.fieldOfStudy].filter(Boolean).join(", ")}
                  </p>
                )}
                <p className="mt-0.5 text-[11px] text-neutral-700">
                  {[edu.fromDate, edu.toDate].filter(Boolean).join(" – ")}
                </p>
              </Card>
            ))}
          </div>
        </Section>
      )}

      {profile.skills.length > 0 && (
        <Section label="Skills">
          <div className="flex flex-wrap gap-1.5">
            {profile.skills.map((skill) => (
              <span
                key={skill.name}
                className="rounded-md border border-neutral-800 bg-neutral-900/60 px-2.5 py-1 text-[11px] text-neutral-400"
              >
                {skill.name}
              </span>
            ))}
          </div>
        </Section>
      )}

      {profile.posts.length > 0 && (
        <Section label="Recent Posts">
          <div className="space-y-2">
            {profile.posts.map((post, i) => (
              <Card key={i}>
                {post.text && (
                  <p className="text-sm leading-relaxed text-neutral-300">
                    {post.text}
                  </p>
                )}
                <div className="mt-2.5 flex items-center gap-4 text-[10px] text-neutral-700">
                  {post.date && <span>{post.date}</span>}
                  {post.likes != null && (
                    <span>{post.likes.toLocaleString()} likes</span>
                  )}
                  {post.comments != null && (
                    <span>{post.comments.toLocaleString()} comments</span>
                  )}
                  {post.reposts != null && (
                    <span>{post.reposts.toLocaleString()} reposts</span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}

interface SubjectPanelData {
  readonly name: string
  readonly email: string
  readonly phone: string
  readonly website: string
  readonly city: string
  readonly state: string
  readonly country?: string
  readonly updatedAt: string | null
  readonly linkedinProfile: LinkedInProfile | null
  readonly stravaProfile: StravaProfile | null
  readonly mrkollProfile: MrkollProfile | null
}

function SubjectContent({ subject }: { subject: SubjectPanelData }) {
  const location = [subject.city, subject.state, subject.country]
    .filter(Boolean)
    .join(", ")
  const sourceCards = [
    subject.linkedinProfile
      ? {
          label: "LinkedIn",
          value: subject.linkedinProfile.headline ?? "Profile loaded",
        }
      : null,
    subject.stravaProfile
      ? {
          label: "Strava",
          value: `${subject.stravaProfile.totalActivities} activities`,
        }
      : null,
    subject.mrkollProfile
      ? {
          label: "Mrkoll",
          value:
            [
              subject.mrkollProfile.age != null
                ? `${subject.mrkollProfile.age} years old`
                : null,
              subject.mrkollProfile.companies.length > 0
                ? `${subject.mrkollProfile.companies.length} company engagements`
                : null,
            ]
              .filter(Boolean)
              .join(" · ") || "Profile loaded",
        }
      : null,
  ].filter(Boolean) as { label: string; value: string }[]

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-light text-foreground">{subject.name}</h3>
        {location && (
          <p className="mt-2.5 text-[11px] text-neutral-600">{location}</p>
        )}
        {subject.updatedAt && (
          <p className="mt-1 text-[11px] text-neutral-700">
            Updated {new Date(subject.updatedAt).toLocaleString()}
          </p>
        )}
      </div>

      <Section label="Contact">
        <div className="space-y-3">
          <Card>
            <div className="space-y-2.5">
              <DetailRow icon={Mail} text={subject.email} />
              <DetailRow icon={Phone} text={subject.phone} />
              <DetailRow icon={Globe} text={subject.website} />
              {location && <DetailRow icon={MapPin} text={location} />}
            </div>
          </Card>
        </div>
      </Section>

      {sourceCards.length > 0 && (
        <Section label="Collected Data">
          <div className="space-y-2">
            {sourceCards.map((item) => (
              <Card key={item.label}>
                <p className="text-sm text-foreground">{item.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                  {item.value}
                </p>
              </Card>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}

/* ─── Strava Profile Content ─── */

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function formatDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`
  return `${Math.round(meters)} m`
}

function ActivityCard({
  activity,
  onClick,
}: {
  activity: StravaActivity
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-lg border border-neutral-800 bg-neutral-900/40 p-3.5 text-left transition-colors hover:border-neutral-700 hover:bg-neutral-900/70"
    >
      <div className="flex items-center gap-2">
        <span className="rounded bg-orange-500/10 px-1.5 py-0.5 text-[10px] text-orange-400">
          {activity.sportType}
        </span>
        <p className="truncate text-sm text-foreground">{activity.title}</p>
      </div>
      <div className="mt-2 flex items-center gap-4 text-[10px] text-neutral-700">
        <span>{new Date(activity.datetime).toLocaleDateString()}</span>
        {activity.distanceMeters != null && activity.distanceMeters > 0 && (
          <span>{formatDistance(activity.distanceMeters)}</span>
        )}
        {activity.movingTimeSeconds != null && (
          <span>{formatDuration(activity.movingTimeSeconds)}</span>
        )}
        {activity.elevationMeters != null && activity.elevationMeters > 0 && (
          <span>{Math.round(activity.elevationMeters)} m elev</span>
        )}
      </div>
    </button>
  )
}

function StravaActivityDetailContent({
  detail,
  onBack,
}: {
  detail: StravaActivityDetail
  onBack: () => void
}) {
  return (
    <div className="space-y-8">
      <div>
        <button
          onClick={onBack}
          className="mb-4 text-[10px] text-neutral-600 transition-colors hover:text-neutral-400"
        >
          &larr; Back to profile
        </button>
        <div className="flex items-center gap-2.5">
          <span className="rounded bg-orange-500/10 px-2 py-0.5 text-[11px] text-orange-400">
            {detail.sportType}
          </span>
          <h3 className="text-xl font-light text-foreground">{detail.title}</h3>
        </div>
        {detail.location && (
          <p className="mt-2 text-[11px] text-neutral-600">{detail.location}</p>
        )}
        {detail.datetime && (
          <p className="mt-1 text-[11px] text-neutral-700">
            {new Date(detail.datetime).toLocaleString()}
          </p>
        )}
      </div>

      <Section label="Stats">
        <div className="grid grid-cols-2 gap-2">
          {detail.distanceMeters != null && detail.distanceMeters > 0 && (
            <Card>
              <p className="text-base font-light text-foreground">
                {formatDistance(detail.distanceMeters)}
              </p>
              <p className="mt-0.5 text-[10px] text-neutral-600">Distance</p>
            </Card>
          )}
          {detail.movingTimeSeconds != null && (
            <Card>
              <p className="text-base font-light text-foreground">
                {formatDuration(detail.movingTimeSeconds)}
              </p>
              <p className="mt-0.5 text-[10px] text-neutral-600">Moving Time</p>
            </Card>
          )}
          {detail.pace && (
            <Card>
              <p className="text-base font-light text-foreground">
                {detail.pace}
              </p>
              <p className="mt-0.5 text-[10px] text-neutral-600">Pace</p>
            </Card>
          )}
          {detail.elevationMeters != null && detail.elevationMeters > 0 && (
            <Card>
              <p className="text-base font-light text-foreground">
                {Math.round(detail.elevationMeters)} m
              </p>
              <p className="mt-0.5 text-[10px] text-neutral-600">Elevation</p>
            </Card>
          )}
          {detail.calories != null && detail.calories > 0 && (
            <Card>
              <p className="text-base font-light text-foreground">
                {detail.calories}
              </p>
              <p className="mt-0.5 text-[10px] text-neutral-600">Calories</p>
            </Card>
          )}
          {detail.elapsedTimeSeconds != null && (
            <Card>
              <p className="text-base font-light text-foreground">
                {formatDuration(detail.elapsedTimeSeconds)}
              </p>
              <p className="mt-0.5 text-[10px] text-neutral-600">
                Elapsed Time
              </p>
            </Card>
          )}
        </div>
      </Section>

      {detail.description && (
        <Section label="Description">
          <p className="text-xs leading-relaxed text-neutral-400">
            {detail.description}
          </p>
        </Section>
      )}

      {detail.achievements.length > 0 && (
        <Section label="Achievements">
          <div className="space-y-1.5">
            {detail.achievements.map((a, i) => (
              <div
                key={i}
                className="rounded-md border border-neutral-800 bg-neutral-900/60 px-2.5 py-1.5 text-[11px] text-neutral-400"
              >
                {a}
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section label="Social">
        <div className="flex gap-4 text-[11px] text-neutral-600">
          <span>{detail.kudosCount} kudos</span>
          <span>{detail.commentsCount} comments</span>
        </div>
      </Section>

      <a
        href={detail.activityUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block text-center text-[11px] text-orange-400/80 transition-colors hover:text-orange-400"
      >
        View on Strava &rarr;
      </a>
    </div>
  )
}

type StravaDetailState =
  | { status: "idle" }
  | { status: "loading"; activityId: string }
  | { status: "loaded"; detail: StravaActivityDetail }
  | { status: "error"; message: string }

function StravaProfileContent({ profile }: { profile: StravaProfile }) {
  const [detailState, setDetailState] = useState<StravaDetailState>({
    status: "idle",
  })

  const sportCounts = new Map<string, number>()
  for (const a of profile.activities) {
    sportCounts.set(a.sportType, (sportCounts.get(a.sportType) ?? 0) + 1)
  }
  const topSports = [...sportCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)

  const recentActivities = profile.activities.slice(0, 10)

  async function handleActivityClick(activityId: string): Promise<void> {
    setDetailState({ status: "loading", activityId })
    try {
      const res = await fetch("/api/strava/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityId }),
      })
      const data = await res.json()
      if (data.ok) {
        setDetailState({ status: "loaded", detail: data.data })
      } else {
        setDetailState({ status: "error", message: data.error })
      }
    } catch {
      setDetailState({ status: "error", message: "Failed to load activity" })
    }
  }

  if (detailState.status === "loading") {
    return <LoadingSpinner text="Loading activity..." />
  }

  if (detailState.status === "loaded") {
    return (
      <StravaActivityDetailContent
        detail={detailState.detail}
        onBack={() => setDetailState({ status: "idle" })}
      />
    )
  }

  if (detailState.status === "error") {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setDetailState({ status: "idle" })}
          className="text-[10px] text-neutral-600 transition-colors hover:text-neutral-400"
        >
          &larr; Back to profile
        </button>
        <p className="py-12 text-center text-xs text-red-400">
          {detailState.message}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-light text-foreground">{profile.name}</h3>
        <p className="mt-2.5 text-[11px] text-neutral-600">
          {profile.totalActivities} total activities
        </p>
      </div>

      <Section label="Stats">
        <div className="grid grid-cols-2 gap-2">
          <Card>
            <p className="text-base font-light text-foreground">
              {profile.totalActivities}
            </p>
            <p className="mt-0.5 text-[10px] text-neutral-600">Activities</p>
          </Card>
          <Card>
            <p className="text-base font-light text-foreground">
              {sportCounts.size}
            </p>
            <p className="mt-0.5 text-[10px] text-neutral-600">Sport types</p>
          </Card>
        </div>
      </Section>

      {topSports.length > 0 && (
        <Section label="Top Sports">
          <div className="flex flex-wrap gap-1.5">
            {topSports.map(([sport, count]) => (
              <span
                key={sport}
                className="rounded-md border border-neutral-800 bg-neutral-900/60 px-2.5 py-1 text-[11px] text-neutral-400"
              >
                {sport} ({count})
              </span>
            ))}
          </div>
        </Section>
      )}

      {recentActivities.length > 0 && (
        <Section label="Recent Activities">
          <div className="space-y-2">
            {recentActivities.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                onClick={() => handleActivityClick(activity.id)}
              />
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}

/* ─── Mrkoll Search Results ─── */

function MrkollSearchResultsList({
  results,
  searchQuery,
  onSelect,
  onRetry,
}: {
  results: readonly MrkollSearchResult[]
  searchQuery: string
  onSelect: (result: MrkollSearchResult) => void
  onRetry: (query: string) => void
}) {
  return (
    <div className="space-y-1">
      <SearchBar
        initialQuery={searchQuery}
        placeholder="Search Mrkoll..."
        onSearch={onRetry}
      />
      {results.length === 0 ? (
        <p className="py-12 text-center text-xs text-neutral-600">
          No results found
        </p>
      ) : (
        <p className="mb-4 text-[10px] text-neutral-600">
          {results.length} potential{" "}
          {results.length === 1 ? "match" : "matches"}
        </p>
      )}
      {results.map((result, i) => (
        <button
          key={i}
          onClick={() => onSelect(result)}
          className="flex w-full items-start gap-3 rounded-lg border border-transparent p-3 text-left transition-colors hover:border-neutral-800 hover:bg-neutral-900/60"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-800 text-xs text-neutral-500">
            {result.name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm text-foreground">{result.name}</p>
              {result.age != null && (
                <span className="shrink-0 text-[10px] text-neutral-600">
                  · {result.age} yr
                </span>
              )}
            </div>
            {result.address && (
              <p className="mt-0.5 line-clamp-1 text-xs text-neutral-500">
                {result.address}
              </p>
            )}
            {result.extraInfo.length > 0 && (
              <p className="mt-0.5 line-clamp-1 text-xs text-neutral-600">
                {result.extraInfo.join(" · ")}
              </p>
            )}
          </div>
        </button>
      ))}
    </div>
  )
}

/* ─── Mrkoll Profile Content ─── */

function MrkollProfileContent({
  profile,
  onOpenCompany,
}: {
  profile: MrkollProfile
  onOpenCompany: (company: MrkollCompanyEngagement) => void
}) {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-light text-foreground">{profile.name}</h3>
        {profile.age != null && (
          <p className="mt-1.5 text-sm text-neutral-400">
            {profile.age} years old
          </p>
        )}
        {profile.address && (
          <p className="mt-1 text-[11px] text-neutral-600">{profile.address}</p>
        )}
        {profile.location && (
          <p className="mt-0.5 text-[11px] text-neutral-600">
            {profile.location}
          </p>
        )}
      </div>

      {profile.personnummer && (
        <Section label="Personnummer">
          <Card>
            <p className="font-mono text-sm text-foreground">
              {profile.personnummer}
            </p>
          </Card>
        </Section>
      )}

      {profile.phoneNumbers.length > 0 && (
        <Section label="Phone Numbers">
          <div className="space-y-2">
            {profile.phoneNumbers.map((phone) => (
              <Card key={phone}>
                <p className="text-sm text-foreground">{phone}</p>
              </Card>
            ))}
          </div>
        </Section>
      )}

      {profile.companies.length > 0 && (
        <Section label="Company Engagements">
          <div className="space-y-2">
            {profile.companies.map((company, i) => (
              <button
                key={i}
                onClick={() => onOpenCompany(company)}
                className="block w-full rounded-lg border border-neutral-800 bg-neutral-900/40 p-3.5 text-left transition-colors hover:border-emerald-800/60"
              >
                <p className="text-sm text-foreground">{company.companyName}</p>
                {company.orgNumber && (
                  <p className="mt-0.5 font-mono text-[11px] text-neutral-600">
                    {company.orgNumber}
                  </p>
                )}
                {company.roles.length > 0 && (
                  <p className="mt-1 text-xs text-neutral-500">
                    {company.roles.join(", ")}
                  </p>
                )}
                {company.registrationYear && (
                  <p className="mt-0.5 text-[10px] text-neutral-700">
                    Reg. {company.registrationYear}
                  </p>
                )}
                {company.krafmanUrl && (
                  <p className="mt-1.5 text-[10px] text-emerald-600">
                    View company details →
                  </p>
                )}
              </button>
            ))}
          </div>
        </Section>
      )}

      {profile.household.length > 0 && (
        <Section label="Household">
          <div className="space-y-2">
            {profile.household.map((member, i) => (
              <Card key={i}>
                <p className="text-sm text-foreground">{member.name}</p>
                {member.age != null && (
                  <p className="mt-0.5 text-[11px] text-neutral-600">
                    {member.age} years old
                  </p>
                )}
              </Card>
            ))}
          </div>
        </Section>
      )}

      {profile.propertyInfo && (
        <Section label="Property">
          <Card>
            <p className="text-xs leading-relaxed text-neutral-400">
              {profile.propertyInfo}
            </p>
          </Card>
        </Section>
      )}
    </div>
  )
}

/* ─── Krafman Company Content ─── */

function KrafmanProfileContent({
  profile,
}: {
  profile: KrafmanCompanyProfile
}) {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-light text-foreground">
          {profile.companyName}
        </h3>
        {profile.orgNumber && (
          <p className="mt-1.5 font-mono text-sm text-neutral-400">
            {profile.orgNumber}
          </p>
        )}
        {profile.status && (
          <span
            className={cn(
              "mt-2 inline-block rounded px-2 py-0.5 text-[10px]",
              profile.status.toLowerCase() === "aktiv"
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-red-500/10 text-red-400"
            )}
          >
            {profile.status}
          </span>
        )}
      </div>

      <Section label="Details">
        <div className="grid grid-cols-2 gap-2">
          {profile.legalForm && (
            <Card>
              <p className="text-xs text-foreground">{profile.legalForm}</p>
              <p className="mt-0.5 text-[10px] text-neutral-600">Legal form</p>
            </Card>
          )}
          {profile.registrationYear && (
            <Card>
              <p className="text-xs text-foreground">
                {profile.registrationYear}
              </p>
              <p className="mt-0.5 text-[10px] text-neutral-600">Registered</p>
            </Card>
          )}
          {profile.shareCapital && (
            <Card>
              <p className="text-xs text-foreground">{profile.shareCapital}</p>
              <p className="mt-0.5 text-[10px] text-neutral-600">
                Share capital
              </p>
            </Card>
          )}
          {profile.industry && (
            <Card>
              <p className="text-xs text-foreground">{profile.industry}</p>
              <p className="mt-0.5 text-[10px] text-neutral-600">Industry</p>
            </Card>
          )}
        </div>
      </Section>

      {profile.address && (
        <Section label="Address">
          <Card>
            <p className="text-sm text-foreground">{profile.address}</p>
            {profile.location && (
              <p className="mt-0.5 text-[11px] text-neutral-600">
                {profile.location}
              </p>
            )}
          </Card>
        </Section>
      )}

      {profile.description && (
        <Section label="Description">
          <p className="text-sm leading-relaxed text-neutral-400">
            {profile.description}
          </p>
        </Section>
      )}

      <Section label="Registrations">
        <div className="flex flex-wrap gap-1.5">
          {profile.fTax != null && (
            <span
              className={cn(
                "rounded-md border px-2.5 py-1 text-[11px]",
                profile.fTax
                  ? "border-emerald-800/40 text-emerald-400"
                  : "border-neutral-800 text-neutral-500"
              )}
            >
              F-tax {profile.fTax ? "✓" : "✗"}
            </span>
          )}
          {profile.vatRegistered != null && (
            <span
              className={cn(
                "rounded-md border px-2.5 py-1 text-[11px]",
                profile.vatRegistered
                  ? "border-emerald-800/40 text-emerald-400"
                  : "border-neutral-800 text-neutral-500"
              )}
            >
              VAT {profile.vatRegistered ? "✓" : "✗"}
            </span>
          )}
          {profile.employerRegistered != null && (
            <span
              className={cn(
                "rounded-md border px-2.5 py-1 text-[11px]",
                profile.employerRegistered
                  ? "border-emerald-800/40 text-emerald-400"
                  : "border-neutral-800 text-neutral-500"
              )}
            >
              Employer {profile.employerRegistered ? "✓" : "✗"}
            </span>
          )}
        </div>
      </Section>

      {profile.boardMembers.length > 0 && (
        <Section label="Board & Management">
          <div className="space-y-2">
            {profile.boardMembers.map((member, i) => (
              <Card key={i}>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-foreground">{member.name}</p>
                  {member.age != null && (
                    <span className="text-[10px] text-neutral-600">
                      {member.age} yr
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-neutral-500">{member.role}</p>
                {member.engagementCount != null && (
                  <p className="mt-0.5 text-[10px] text-neutral-700">
                    {member.engagementCount} engagements
                  </p>
                )}
              </Card>
            ))}
          </div>
        </Section>
      )}

      {profile.debt && (
        <Section label="Debt (Kronofogden)">
          <div className="space-y-2">
            {profile.debt.generalDebt && (
              <Card>
                <p className="text-sm text-foreground">
                  {profile.debt.generalDebt}
                </p>
                <p className="mt-0.5 text-[10px] text-neutral-600">
                  General debt
                </p>
              </Card>
            )}
            {profile.debt.individualDebt && (
              <Card>
                <p className="text-sm text-foreground">
                  {profile.debt.individualDebt}
                </p>
                <p className="mt-0.5 text-[10px] text-neutral-600">
                  Individual debt
                </p>
              </Card>
            )}
            {profile.debt.paymentRemarks != null && (
              <Card>
                <p className="text-sm text-foreground">
                  {profile.debt.paymentRemarks}
                </p>
                <p className="mt-0.5 text-[10px] text-neutral-600">
                  Payment remarks
                </p>
              </Card>
            )}
          </div>
        </Section>
      )}
    </div>
  )
}

/* ─── X/Twitter Content ─── */

function XContent({ profile }: { profile: UserTwitterProfile | null }) {
  const d = profile

  if (!d) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-neutral-400">No saved profile</p>
        <p className="mt-2 text-xs text-neutral-600">
          Twitter data has not been stored for this user yet.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-light text-foreground">{d.handle}</h3>
        <p className="mt-1 text-sm text-neutral-400">{d.name}</p>
        <p className="mt-2 text-sm leading-relaxed text-neutral-500">{d.bio}</p>
        <p className="mt-2.5 text-[11px] text-neutral-600">
          {d.location} · {d.website} · joined{" "}
          {new Date(d.joined).toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      <Section label="Activity">
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Followers", value: d.followers.toLocaleString() },
            { label: "Following", value: d.following.toLocaleString() },
            { label: "Tweets", value: d.tweets_count.toLocaleString() },
            { label: "Likes given", value: d.likes_count.toLocaleString() },
          ].map(({ label, value }) => (
            <Card key={label}>
              <p className="text-base font-light text-foreground">{value}</p>
              <p className="mt-0.5 text-[10px] text-neutral-600">{label}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section label="Top Topics">
        <div className="flex flex-wrap gap-1.5">
          {d.top_topics.map((topic) => (
            <span
              key={topic}
              className="rounded-md border border-neutral-800 bg-neutral-900/60 px-2.5 py-1 text-[11px] text-neutral-400"
            >
              {topic}
            </span>
          ))}
        </div>
      </Section>

      <Section label="Recent Tweets">
        <div className="space-y-2">
          {d.recent_tweets.map((tweet) => (
            <Card key={tweet.id}>
              <p className="text-sm leading-relaxed text-neutral-300">
                {tweet.text}
              </p>
              <div className="mt-2.5 flex items-center gap-4 text-[10px] text-neutral-700">
                <span>{tweet.likes.toLocaleString()} likes</span>
                <span>{tweet.retweets.toLocaleString()} RT</span>
                <span>{tweet.replies.toLocaleString()} replies</span>
                <span>{(tweet.views / 1000).toFixed(0)}k views</span>
              </div>
            </Card>
          ))}
        </div>
      </Section>
    </div>
  )
}

/* ─── Breach Results ─── */

function BreachRecordCard({ record }: { record: BreachRecord }) {
  const entries = Object.entries(record).filter(([, v]) => v !== null && v !== undefined && v !== "")
  return (
    <Card>
      <div className="space-y-1.5">
        {entries.map(([key, value]) => (
          <div key={key} className="flex gap-2 text-xs">
            <span className="w-24 shrink-0 font-mono text-[10px] text-neutral-600 uppercase">
              {key}
            </span>
            <span className="min-w-0 break-all text-neutral-400">
              {String(value)}
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}

function BreachResultsContent({ data }: { data: BreachSearchResult }) {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-light text-foreground">{data.count} record{data.count !== 1 ? "s" : ""}</h3>
        <p className="mt-1.5 text-sm text-neutral-500">
          searched for &ldquo;{data.term}&rdquo;
        </p>
      </div>

      {data.count === 0 ? (
        <p className="py-12 text-center text-xs text-neutral-600">No breach records found</p>
      ) : (
        <Section label={`Results (${data.count})`}>
          <div className="space-y-3">
            {data.results.map((record, i) => (
              <BreachRecordCard key={i} record={record} />
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}

/* ─── Panel State Types ─── */

export type LinkedInPanelState =
  | { status: "searching" }
  | {
      status: "search-results"
      results: readonly LinkedInSearchResult[]
      query: string
    }
  | { status: "scraping"; name: string }
  | { status: "profile"; profile: LinkedInProfile }
  | { status: "error"; message: string }

export type StravaPanelState =
  | { status: "searching" }
  | {
      status: "search-results"
      results: readonly StravaSearchResult[]
      query: string
    }
  | { status: "scraping"; name: string }
  | { status: "profile"; profile: StravaProfile }
  | { status: "error"; message: string }

export type MrkollPanelState =
  | { status: "searching" }
  | {
      status: "search-results"
      results: readonly MrkollSearchResult[]
      query: string
    }
  | { status: "scraping"; name: string }
  | { status: "profile"; profile: MrkollProfile }
  | { status: "error"; message: string }

export type BreachPanelState =
  | { status: "searching" }
  | { status: "results"; data: BreachSearchResult }
  | { status: "error"; message: string }

export type KrafmanPanelState =
  | { status: "scraping"; companyName: string }
  | { status: "profile"; profile: KrafmanCompanyProfile }
  | { status: "error"; message: string }

/* ─── Detail Panel ─── */

interface DetailPanelProps {
  source: "subject" | "linkedin" | "x" | "strava" | "mrkoll" | "company" | "breach" | null
  onClose: () => void
  subject: SubjectPanelData
  linkedinState: LinkedInPanelState | null
  onSelectLinkedInResult: (result: LinkedInSearchResult) => void
  onRetryLinkedInSearch: (query: string) => void
  stravaState: StravaPanelState | null
  onSelectStravaResult: (result: StravaSearchResult) => void
  onRetryStravaSearch: (query: string) => void
  mrkollState: MrkollPanelState | null
  onSelectMrkollResult: (result: MrkollSearchResult) => void
  onRetryMrkollSearch: (query: string) => void
  onOpenCompany: (company: MrkollCompanyEngagement) => void
  krafmanState: KrafmanPanelState | null
  twitterProfile: UserTwitterProfile | null
  breachState: BreachPanelState | null
}

export function DetailPanel({
  source,
  onClose,
  subject,
  linkedinState,
  onSelectLinkedInResult,
  onRetryLinkedInSearch,
  stravaState,
  onSelectStravaResult,
  onRetryStravaSearch,
  mrkollState,
  onSelectMrkollResult,
  onRetryMrkollSearch,
  onOpenCompany,
  krafmanState,
  twitterProfile,
  breachState,
}: DetailPanelProps) {
  const open = source !== null

  function renderLinkedinContent(): ReactNode {
    if (!linkedinState) return null
    switch (linkedinState.status) {
      case "searching":
        return <LoadingSpinner text="Searching LinkedIn..." />
      case "search-results":
        return (
          <LinkedInSearchResultsList
            results={linkedinState.results}
            searchQuery={linkedinState.query}
            onSelect={onSelectLinkedInResult}
            onRetry={onRetryLinkedInSearch}
          />
        )
      case "scraping":
        return <LoadingSpinner text={`Scraping ${linkedinState.name}...`} />
      case "profile":
        return <LinkedinProfileContent profile={linkedinState.profile} />
      case "error":
        return (
          <p className="py-12 text-center text-xs text-red-400">
            {linkedinState.message}
          </p>
        )
    }
  }

  function renderStravaContent(): ReactNode {
    if (!stravaState) return null
    switch (stravaState.status) {
      case "searching":
        return <LoadingSpinner text="Searching Strava..." />
      case "search-results":
        return (
          <StravaSearchResultsList
            results={stravaState.results}
            searchQuery={stravaState.query}
            onSelect={onSelectStravaResult}
            onRetry={onRetryStravaSearch}
          />
        )
      case "scraping":
        return <LoadingSpinner text={`Loading ${stravaState.name}...`} />
      case "profile":
        return <StravaProfileContent profile={stravaState.profile} />
      case "error":
        return (
          <p className="py-12 text-center text-xs text-red-400">
            {stravaState.message}
          </p>
        )
    }
  }

  function renderMrkollContent(): ReactNode {
    if (!mrkollState) return null
    switch (mrkollState.status) {
      case "searching":
        return <LoadingSpinner text="Searching Mrkoll..." />
      case "search-results":
        return (
          <MrkollSearchResultsList
            results={mrkollState.results}
            searchQuery={mrkollState.query}
            onSelect={onSelectMrkollResult}
            onRetry={onRetryMrkollSearch}
          />
        )
      case "scraping":
        return <LoadingSpinner text={`Loading ${mrkollState.name}...`} />
      case "profile":
        return (
          <MrkollProfileContent
            profile={mrkollState.profile}
            onOpenCompany={onOpenCompany}
          />
        )
      case "error":
        return (
          <p className="py-12 text-center text-xs text-red-400">
            {mrkollState.message}
          </p>
        )
    }
  }

  function renderBreachContent(): ReactNode {
    if (!breachState) return null
    switch (breachState.status) {
      case "searching":
        return <LoadingSpinner text="Searching breach records..." />
      case "results":
        return <BreachResultsContent data={breachState.data} />
      case "error":
        return (
          <p className="py-12 text-center text-xs text-red-400">
            {breachState.message}
          </p>
        )
    }
  }

  function renderKrafmanContent(): ReactNode {
    if (!krafmanState) return null
    switch (krafmanState.status) {
      case "scraping":
        return (
          <LoadingSpinner text={`Loading ${krafmanState.companyName}...`} />
        )
      case "profile":
        return <KrafmanProfileContent profile={krafmanState.profile} />
      case "error":
        return (
          <p className="py-12 text-center text-xs text-red-400">
            {krafmanState.message}
          </p>
        )
    }
  }

  function getPanelTitle(): string {
    switch (source) {
      case "subject":
        return "SUBJECT"
      case "linkedin":
        return linkedinState?.status === "search-results"
          ? "LINKEDIN — SELECT PROFILE"
          : "LINKEDIN"
      case "strava":
        return stravaState?.status === "search-results"
          ? "STRAVA — SELECT ATHLETE"
          : "STRAVA"
      case "x":
        return "X / TWITTER"
      case "mrkoll":
        return mrkollState?.status === "search-results"
          ? "MRKOLL — SELECT PERSON"
          : "MRKOLL"
      case "company":
        return "COMPANY"
      case "breach":
        return "BREACH"
      default:
        return ""
    }
  }

  function getAccentColor(): string {
    switch (source) {
      case "subject":
        return "bg-neutral-500/40"
      case "linkedin":
        return "bg-blue-600/40"
      case "strava":
        return "bg-orange-500/40"
      case "mrkoll":
        return "bg-purple-600/40"
      case "company":
        return "bg-emerald-600/40"
      case "breach":
        return "bg-red-600/40"
      default:
        return "bg-neutral-700/60"
    }
  }

  function getLabelColor(): string {
    switch (source) {
      case "subject":
        return "text-neutral-300"
      case "linkedin":
        return "text-blue-500"
      case "strava":
        return "text-orange-500"
      case "mrkoll":
        return "text-purple-500"
      case "company":
        return "text-emerald-500"
      case "breach":
        return "text-red-500"
      default:
        return "text-neutral-400"
    }
  }

  return (
    <div
      className={cn(
        "fixed inset-y-0 right-0 z-40 flex w-[420px] flex-col bg-background",
        "border-l border-neutral-800",
        "transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
        open ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      )}
    >
      <div
        className={cn(
          "h-[2px] w-full shrink-0 transition-colors duration-300",
          getAccentColor()
        )}
      />

      <div className="flex shrink-0 items-center justify-between px-6 py-5">
        <span
          className={cn(
            "font-mono text-[9px] tracking-[0.25em]",
            getLabelColor()
          )}
        >
          {getPanelTitle()}
        </span>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-neutral-600 transition-colors hover:bg-neutral-900 hover:text-neutral-300"
          aria-label="Close panel"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="h-px shrink-0 bg-neutral-800" />

      <div className="scrollbar-none flex-1 overflow-y-auto px-6 py-7">
        {source === "subject" && <SubjectContent subject={subject} />}
        {source === "linkedin" && renderLinkedinContent()}
        {source === "strava" && renderStravaContent()}
        {source === "x" && <XContent profile={twitterProfile} />}
        {source === "mrkoll" && renderMrkollContent()}
        {source === "company" && renderKrafmanContent()}
        {source === "breach" && renderBreachContent()}
      </div>
    </div>
  )
}
