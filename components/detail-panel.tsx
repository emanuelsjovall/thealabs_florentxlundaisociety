"use client"

import { useState, useEffect, type ReactNode } from "react"
import {
  X,
  Loader2,
  Search,
  MapPin,
  Mail,
  Phone,
  Globe,
  Plus,
  Trash2,
  ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { LinkedInProfile, LinkedInSearchResult } from "@/lib/linkedin"
import type {
  StravaProfile,
  StravaSearchResult,
  StravaActivity,
} from "@/lib/strava"
import type { KrafmanCompanyProfile } from "@/lib/krafman.types"
import type { GithubSearchResult } from "@/lib/github-api"
import type { TwitterSearchResult } from "@/lib/twitter-api"
import type {
  UserGithubProfile,
  UserTwitterProfile,
} from "@/lib/user-record"
import type { BreachSearchResult, BreachRecord } from "@/lib/breach"
import type { PersonalNote } from "@/lib/personal-note"
import type { TimelineEvent, TimelineCluster } from "@/lib/timeline-types"

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-[9px] tracking-[0.22em] text-neutral-400 uppercase dark:text-neutral-600">
        {label}
      </p>
      {children}
    </div>
  )
}

function Card({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white/80 dark:border-neutral-800 dark:bg-neutral-900/40 p-3.5">
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

const COLLAPSE_THRESHOLD = 220

function ExpandableText({ text, className }: { text: string; className?: string }) {
  const [expanded, setExpanded] = useState(false)
  const isLong = text.length > COLLAPSE_THRESHOLD

  return (
    <div>
      <p className={cn("text-sm leading-relaxed text-foreground", className)}>
        {isLong && !expanded ? text.slice(0, COLLAPSE_THRESHOLD).trimEnd() + "…" : text}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-1.5 text-[11px] text-neutral-500 transition-colors hover:text-foreground"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
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
    <div className="mb-4 flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/60 px-3 py-2">
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
          className="flex w-full items-start gap-3 rounded-lg border border-transparent p-3 text-left transition-colors hover:border-neutral-300 hover:bg-neutral-50 dark:hover:border-neutral-800 dark:hover:bg-neutral-900/60"
        >
          {result.profileImageUrl ? (
            <img
              src={result.profileImageUrl}
              alt=""
              className="h-10 w-10 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs text-neutral-500 dark:bg-neutral-800">
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

/* ─── X Search Results ─── */

function TwitterSearchResultsList({
  results,
  searchQuery,
  onSelect,
  onRetry,
}: {
  results: readonly TwitterSearchResult[]
  searchQuery: string
  onSelect: (result: TwitterSearchResult) => void
  onRetry: (query: string) => void
}) {
  return (
    <div className="space-y-1">
      <SearchBar
        initialQuery={searchQuery}
        placeholder="Search X accounts..."
        onSearch={onRetry}
      />
      {results.length === 0 ? (
        <p className="py-12 text-center text-xs text-neutral-600">
          No accounts found
        </p>
      ) : (
        <p className="mb-4 text-[10px] text-neutral-600">
          {results.length} potential{" "}
          {results.length === 1 ? "match" : "matches"}
        </p>
      )}
      {results.map((result) => (
        <button
          key={result.screenName}
          type="button"
          onClick={() => onSelect(result)}
          className="flex w-full items-start gap-3 rounded-lg border border-transparent p-3 text-left transition-colors hover:border-neutral-300 hover:bg-neutral-50 dark:hover:border-neutral-800 dark:hover:bg-neutral-900/60"
        >
          {result.profileImageUrl ? (
            <img
              src={result.profileImageUrl}
              alt=""
              className="h-10 w-10 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs text-neutral-500 dark:bg-neutral-800">
              {result.name.charAt(0)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-foreground">{result.name}</p>
            <p className="mt-0.5 font-mono text-[11px] text-neutral-500">
              @{result.screenName}
            </p>
            {result.description ? (
              <p className="mt-1 line-clamp-2 text-xs text-neutral-600">
                {result.description}
              </p>
            ) : null}
          </div>
        </button>
      ))}
    </div>
  )
}

/* ─── GitHub Search Results ─── */

function GithubSearchResultsList({
  results,
  searchQuery,
  onSelect,
  onRetry,
}: {
  results: readonly GithubSearchResult[]
  searchQuery: string
  onSelect: (result: GithubSearchResult) => void
  onRetry: (query: string) => void
}) {
  return (
    <div className="space-y-1">
      <SearchBar
        initialQuery={searchQuery}
        placeholder="Search GitHub users..."
        onSearch={onRetry}
      />
      {results.length === 0 ? (
        <p className="py-12 text-center text-xs text-neutral-600">
          No users found
        </p>
      ) : (
        <p className="mb-4 text-[10px] text-neutral-600">
          {results.length} potential{" "}
          {results.length === 1 ? "match" : "matches"}
        </p>
      )}
      {results.map((result) => (
        <button
          key={result.login}
          type="button"
          onClick={() => onSelect(result)}
          className="flex w-full items-start gap-3 rounded-lg border border-transparent p-3 text-left transition-colors hover:border-neutral-300 hover:bg-neutral-50 dark:hover:border-neutral-800 dark:hover:bg-neutral-900/60"
        >
          {result.avatar_url ? (
            <img
              src={result.avatar_url}
              alt=""
              className="h-10 w-10 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs text-neutral-500 dark:bg-neutral-800">
              {result.login.charAt(0)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-mono text-sm text-foreground">
              {result.login}
            </p>
            <p className="mt-0.5 text-[10px] text-neutral-600">{result.type}</p>
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
          className="flex w-full items-start gap-3 rounded-lg border border-transparent p-3 text-left transition-colors hover:border-neutral-300 hover:bg-neutral-50 dark:hover:border-neutral-800 dark:hover:bg-neutral-900/60"
        >
          {result.profileImageUrl ? (
            <img
              src={result.profileImageUrl}
              alt=""
              className="h-10 w-10 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs text-neutral-500 dark:bg-neutral-800">
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
          <ExpandableText text={profile.about} />
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
                className="rounded-md border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/60 px-2.5 py-1 text-[11px] text-neutral-400"
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
                {post.isRepost === true && (
                  <p className="mb-2 text-[9px] font-medium uppercase tracking-wide text-amber-600/90">
                    Repost
                  </p>
                )}
                {post.text && <ExpandableText text={post.text} />}
                <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-neutral-700">
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
  readonly githubProfile: UserGithubProfile | null
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
    subject.githubProfile
      ? {
          label: "GitHub",
          value: `@${subject.githubProfile.login} · ${subject.githubProfile.public_repos} repos`,
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

function NoteEditor({
  note,
  onSave,
  onDelete,
}: {
  readonly note: PersonalNote
  readonly onSave: (content: string) => Promise<void>
  readonly onDelete: () => void
}) {
  const [value, setValue] = useState(note.content)

  useEffect(() => {
    setValue(note.content)
  }, [note.content])

  return (
    <Card>
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="font-mono text-[10px] text-neutral-600">
          {new Date(note.updatedAt).toLocaleString()}
        </p>
        <button
          type="button"
          onClick={() => {
            void onDelete()
          }}
          className="rounded p-1 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-red-500 dark:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-red-400"
          aria-label="Delete note"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <textarea
        className="min-h-[120px] w-full resize-y rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm leading-relaxed text-neutral-800 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none dark:border-neutral-800 dark:bg-neutral-950/80 dark:text-neutral-200 dark:placeholder:text-neutral-600 dark:focus:border-neutral-600"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => {
          if (value !== note.content) {
            void onSave(value)
          }
        }}
        placeholder="Write a note..."
      />
    </Card>
  )
}

function NotesPanelContent({
  notes,
  onCreateNote,
  onSaveNote,
  onDeleteNote,
}: {
  readonly notes: readonly PersonalNote[]
  readonly onCreateNote: () => Promise<void>
  readonly onSaveNote: (id: string, content: string) => Promise<void>
  readonly onDeleteNote: (id: string) => Promise<void>
}) {
  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => void onCreateNote()}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 py-2.5 text-xs text-neutral-600 transition-colors hover:border-neutral-300 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900/60 dark:text-neutral-300 dark:hover:border-neutral-600 dark:hover:bg-neutral-900"
      >
        <Plus className="h-3.5 w-3.5" />
        New note
      </button>
      {notes.length === 0 ? (
        <p className="py-8 text-center text-xs text-neutral-600">
          No notes yet. Add one to capture free-text findings.
        </p>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <NoteEditor
              key={note.id}
              note={note}
              onSave={(content) => onSaveNote(note.id, content)}
              onDelete={() => void onDeleteNote(note.id)}
            />
          ))}
        </div>
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

function parseStravaDatetime(raw: string): Date {
  // Strava uses +0000 (no colon) which isn't strict ISO — normalize it
  const normalized = raw.trim().replace(/([+-])(\d{2})(\d{2})$/, "$1$2:$3")
  return new Date(normalized)
}

function ActivityCard({
  activity,
  onClick,
}: {
  readonly activity: StravaActivity
  readonly onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full rounded-lg border border-neutral-200 bg-white/80 dark:border-neutral-800 dark:bg-neutral-900/40 p-3.5 text-left transition-colors hover:border-neutral-300 hover:bg-neutral-50 dark:hover:border-neutral-700 dark:hover:bg-neutral-900/70"
    >
      <div className="flex items-center gap-2">
        <span className="rounded bg-orange-500/10 px-1.5 py-0.5 text-[10px] text-orange-400">
          {activity.sportType}
        </span>
        <p className="truncate text-sm text-foreground">{activity.title}</p>
      </div>
      <div className="mt-2 flex items-center gap-4 text-[10px] text-neutral-700">
        <span>{parseStravaDatetime(activity.datetime).toLocaleDateString()}</span>
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

function StravaActivityDetailView({
  activity,
  onBack,
}: {
  readonly activity: StravaActivity
  readonly onBack: () => void
}) {
  return (
    <div className="space-y-8">
      <div>
        <button
          type="button"
          onClick={onBack}
          className="mb-4 text-[10px] text-neutral-600 transition-colors hover:text-neutral-400"
        >
          &larr; Back to profile
        </button>
        <div className="flex items-center gap-2.5">
          <span className="rounded bg-orange-500/10 px-2 py-0.5 text-[11px] text-orange-400">
            {activity.sportType}
          </span>
          <h3 className="text-xl font-light text-foreground">{activity.title}</h3>
        </div>
        {activity.location && (
          <p className="mt-2 text-[11px] text-neutral-600">{activity.location}</p>
        )}
        <p className="mt-1 text-[11px] text-neutral-700">
          {parseStravaDatetime(activity.datetime).toLocaleString()}
        </p>
      </div>

      {activity.mapUrl && (
        <Section label="Route">
          <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white/80 dark:border-neutral-800 dark:bg-neutral-900/40">
            <img
              src={activity.mapUrl}
              alt={`${activity.title} route map`}
              className="aspect-[1.35] w-full object-cover"
            />
          </div>
        </Section>
      )}

      <Section label="Stats">
        <div className="grid grid-cols-2 gap-2">
          {activity.distanceMeters != null && activity.distanceMeters > 0 && (
            <Card>
              <p className="text-base font-light text-foreground">
                {formatDistance(activity.distanceMeters)}
              </p>
              <p className="mt-0.5 text-[10px] text-neutral-600">Distance</p>
            </Card>
          )}
          {activity.movingTimeSeconds != null && (
            <Card>
              <p className="text-base font-light text-foreground">
                {formatDuration(activity.movingTimeSeconds)}
              </p>
              <p className="mt-0.5 text-[10px] text-neutral-600">Moving Time</p>
            </Card>
          )}
          {activity.pace && (
            <Card>
              <p className="text-base font-light text-foreground">
                {activity.pace}
              </p>
              <p className="mt-0.5 text-[10px] text-neutral-600">Pace</p>
            </Card>
          )}
          {activity.elevationMeters != null && activity.elevationMeters > 0 && (
            <Card>
              <p className="text-base font-light text-foreground">
                {Math.round(activity.elevationMeters)} m
              </p>
              <p className="mt-0.5 text-[10px] text-neutral-600">Elevation</p>
            </Card>
          )}
          {activity.calories != null && activity.calories > 0 && (
            <Card>
              <p className="text-base font-light text-foreground">
                {activity.calories}
              </p>
              <p className="mt-0.5 text-[10px] text-neutral-600">Calories</p>
            </Card>
          )}
          {activity.elapsedTimeSeconds != null && (
            <Card>
              <p className="text-base font-light text-foreground">
                {formatDuration(activity.elapsedTimeSeconds)}
              </p>
              <p className="mt-0.5 text-[10px] text-neutral-600">Elapsed Time</p>
            </Card>
          )}
        </div>
      </Section>

      {activity.description && (
        <Section label="Description">
          <p className="text-xs leading-relaxed text-neutral-400">
            {activity.description}
          </p>
        </Section>
      )}

      {activity.achievements && activity.achievements.length > 0 && (
        <Section label="Achievements">
          <div className="space-y-1.5">
            {activity.achievements.map((a, i) => (
              <div
                key={i}
                className="rounded-md border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/60 px-2.5 py-1.5 text-[11px] text-neutral-400"
              >
                {a}
              </div>
            ))}
          </div>
        </Section>
      )}

      {(activity.kudosCount != null || activity.commentsCount != null) && (
        <Section label="Social">
          <div className="flex gap-4 text-[11px] text-neutral-600">
            {activity.kudosCount != null && <span>{activity.kudosCount} kudos</span>}
            {activity.commentsCount != null && <span>{activity.commentsCount} comments</span>}
          </div>
        </Section>
      )}

      <a
        href={activity.activityUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block text-center text-[11px] text-orange-400/80 transition-colors hover:text-orange-400"
      >
        View on Strava &rarr;
      </a>
    </div>
  )
}

function StravaProfileContent({ profile }: { profile: StravaProfile }) {
  const [showAll, setShowAll] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState<StravaActivity | null>(null)

  const sportCounts = new Map<string, number>()
  for (const a of profile.activities) {
    sportCounts.set(a.sportType, (sportCounts.get(a.sportType) ?? 0) + 1)
  }
  const topSports = [...sportCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)

  const INITIAL_COUNT = 20
  const visibleActivities = showAll
    ? profile.activities
    : profile.activities.slice(0, INITIAL_COUNT)
  const hasMore = profile.activities.length > INITIAL_COUNT

  if (selectedActivity) {
    return (
      <StravaActivityDetailView
        activity={selectedActivity}
        onBack={() => setSelectedActivity(null)}
      />
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
                className="rounded-md border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/60 px-2.5 py-1 text-[11px] text-neutral-400"
              >
                {sport} ({count})
              </span>
            ))}
          </div>
        </Section>
      )}

      {visibleActivities.length > 0 && (
        <Section label="Activities">
          <div className="space-y-2">
            {visibleActivities.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                onClick={() => setSelectedActivity(activity as StravaActivity)}
              />
            ))}
            {hasMore && !showAll && (
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className="w-full rounded-md border border-neutral-800 py-2 text-[10px] tracking-[0.15em] text-neutral-500 uppercase transition-colors hover:text-neutral-300"
              >
                Show all {profile.activities.length} activities
              </button>
            )}
          </div>
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
          <ExpandableText text={profile.description} />
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
                  : "border-neutral-200 text-neutral-500 dark:border-neutral-800"
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
                  : "border-neutral-200 text-neutral-500 dark:border-neutral-800"
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
                  : "border-neutral-200 text-neutral-500 dark:border-neutral-800"
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

function TwitterProfileContent({
  profile,
  onRefresh,
}: {
  profile: UserTwitterProfile
  onRefresh: () => void
}) {
  const d = profile

  const meta = [
    d.location,
    d.website,
    d.joined
      ? `joined ${new Date(d.joined).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        })}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ")

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-light text-foreground">{d.handle}</h3>
          <p className="mt-1 text-sm text-neutral-400">{d.name}</p>
          <p className="mt-2 text-sm leading-relaxed text-neutral-500">
            {d.bio}
          </p>
          {meta && <p className="mt-2.5 text-[11px] text-neutral-600">{meta}</p>}
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="rounded-lg border border-neutral-200 px-2.5 py-1.5 text-[10px] tracking-[0.2em] text-neutral-500 transition-colors hover:border-neutral-400 hover:text-foreground dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-neutral-500"
        >
          REFRESH
        </button>
      </div>

      {d.last_synced_at && (
        <Section label="Cache">
          <p className="text-sm text-neutral-500">
            Synced{" "}
            {new Date(d.last_synced_at).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
        </Section>
      )}

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

      {d.top_topics.length > 0 && (
        <Section label="Top Topics">
          <div className="flex flex-wrap gap-1.5">
            {d.top_topics.map((topic) => (
              <span
                key={topic}
                className="rounded-md border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/60 px-2.5 py-1 text-[11px] text-neutral-400"
              >
                {topic}
              </span>
            ))}
          </div>
        </Section>
      )}

      <Section label="Recent Tweets">
        {d.recent_tweets.length === 0 ? (
          <p className="text-sm text-neutral-600">No cached tweets yet.</p>
        ) : (
          <div className="space-y-2">
            {d.recent_tweets.map((tweet) => (
              <Card key={tweet.id}>
                <ExpandableText text={tweet.text} />
                <div className="mt-2.5 flex flex-wrap items-center gap-4 text-[10px] text-neutral-700">
                  <span>{tweet.likes.toLocaleString()} likes</span>
                  <span>{tweet.retweets.toLocaleString()} RT</span>
                  <span>{tweet.replies.toLocaleString()} replies</span>
                  {tweet.views > 0 && (
                    <span>{tweet.views.toLocaleString()} views</span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Section>
    </div>
  )
}

/* ─── GitHub Content ─── */

function GithubProfileContent({
  profile,
  onRefresh,
}: {
  profile: UserGithubProfile
  onRefresh: () => void
}) {
  const d = profile

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 gap-4">
          {d.avatar_url ? (
            <img
              src={d.avatar_url}
              alt=""
              className="h-16 w-16 shrink-0 rounded-full object-cover"
            />
          ) : null}
          <div className="min-w-0">
            <h3 className="truncate font-mono text-xl font-light text-foreground">
              {d.login}
            </h3>
            {d.name ? (
              <p className="mt-1 text-sm text-neutral-400">{d.name}</p>
            ) : null}
            <p className="mt-2 text-sm leading-relaxed text-neutral-500">
              {d.bio ?? ""}
            </p>
            <a
              href={d.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-neutral-500 transition-colors hover:text-neutral-300"
            >
              <ExternalLink className="h-3 w-3" />
              Open on GitHub
            </a>
          </div>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="shrink-0 rounded-lg border border-neutral-700 px-2.5 py-1.5 text-[10px] tracking-[0.2em] text-neutral-400 transition-colors hover:border-neutral-500 hover:text-foreground"
        >
          REFRESH
        </button>
      </div>

      {d.last_synced_at ? (
        <Section label="Cache">
          <p className="text-sm text-neutral-500">
            Synced{" "}
            {new Date(d.last_synced_at).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
        </Section>
      ) : null}

      <Section label="Stats">
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Followers", value: d.followers.toLocaleString() },
            { label: "Following", value: d.following.toLocaleString() },
            { label: "Public repos", value: d.public_repos.toLocaleString() },
            { label: "Public gists", value: d.public_gists.toLocaleString() },
          ].map(({ label, value }) => (
            <Card key={label}>
              <p className="text-base font-light text-foreground">{value}</p>
              <p className="mt-0.5 text-[10px] text-neutral-600">{label}</p>
            </Card>
          ))}
        </div>
      </Section>

      {d.twitter_username || d.email || d.company || d.location || d.blog ? (
        <Section label="Details">
          <div className="space-y-2">
            {d.company ? (
              <Card>
                <p className="text-xs text-neutral-600">Company</p>
                <p className="mt-1 text-sm text-foreground">{d.company}</p>
              </Card>
            ) : null}
            {d.location ? (
              <Card>
                <p className="text-xs text-neutral-600">Location</p>
                <p className="mt-1 text-sm text-foreground">{d.location}</p>
              </Card>
            ) : null}
            {d.blog ? (
              <Card>
                <p className="text-xs text-neutral-600">Website</p>
                <a
                  href={
                    d.blog.startsWith("http") ? d.blog : `https://${d.blog}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block text-sm text-neutral-300 hover:text-foreground"
                >
                  {d.blog}
                </a>
              </Card>
            ) : null}
            {d.twitter_username ? (
              <Card>
                <p className="text-xs text-neutral-600">
                  X handle (from GitHub profile)
                </p>
                <p className="mt-1 font-mono text-sm text-foreground">
                  @{d.twitter_username}
                </p>
              </Card>
            ) : null}
            {d.email ? (
              <Card>
                <p className="text-xs text-neutral-600">Public email</p>
                <p className="mt-1 text-sm text-foreground">{d.email}</p>
              </Card>
            ) : null}
          </div>
        </Section>
      ) : null}

      <Section label="Repositories (recent)">
        {d.repos.length === 0 ? (
          <p className="text-sm text-neutral-600">No public repos listed.</p>
        ) : (
          <div className="space-y-2">
            {d.repos.map((repo) => (
              <Card key={repo.full_name}>
                <a
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-sm text-foreground hover:text-neutral-200"
                >
                  {repo.full_name}
                </a>
                {repo.description ? (
                  <p className="mt-1 line-clamp-2 text-xs text-neutral-500">
                    {repo.description}
                  </p>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-neutral-700">
                  <span>{repo.stargazers_count} stars</span>
                  {repo.language ? <span>{repo.language}</span> : null}
                  {repo.archived ? <span>archived</span> : null}
                  {repo.fork ? <span>fork</span> : null}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Section>

      <Section label="Raw API user object">
        <Card>
          <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-all font-mono text-[10px] leading-relaxed text-neutral-500">
            {JSON.stringify(d.api_user, null, 2)}
          </pre>
        </Card>
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

export type TwitterPanelState =
  | { status: "searching" }
  | {
      status: "search-results"
      results: readonly TwitterSearchResult[]
      query: string
    }
  | { status: "syncing"; username: string }
  | { status: "profile"; profile: UserTwitterProfile }
  | { status: "error"; message: string }

export type GithubPanelState =
  | { status: "searching" }
  | {
      status: "search-results"
      results: readonly GithubSearchResult[]
      query: string
    }
  | { status: "syncing"; username: string }
  | { status: "profile"; profile: UserGithubProfile }
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
  source:
    | "subject"
    | "linkedin"
    | "x"
    | "strava"
    | "company"
    | "breach"
    | "github"
    | "notes"
    | "timeline-event"
    | "timeline-cluster"
    | null
  timelineEvent?: TimelineEvent | null
  timelineCluster?: TimelineCluster | null
  highlightedEventId?: string | null
  onClusterEventHighlight?: (eventId: string | null) => void
  onClose: () => void
  subject: SubjectPanelData
  linkedinState: LinkedInPanelState | null
  onSelectLinkedInResult: (result: LinkedInSearchResult) => void
  onRetryLinkedInSearch: (query: string) => void
  stravaState: StravaPanelState | null
  onSelectStravaResult: (result: StravaSearchResult) => void
  onRetryStravaSearch: (query: string) => void
  krafmanState: KrafmanPanelState | null
  twitterState: TwitterPanelState | null
  onSelectTwitterResult: (result: TwitterSearchResult) => void
  onRetryTwitterSearch: (query: string) => void
  onRefreshTwitter: () => void
  githubState: GithubPanelState | null
  onSelectGithubResult: (result: GithubSearchResult) => void
  onRetryGithubSearch: (query: string) => void
  onRefreshGithub: () => void
  breachState: BreachPanelState | null
  notes: readonly PersonalNote[]
  onCreateNote: () => Promise<void>
  onSaveNote: (id: string, content: string) => Promise<void>
  onDeleteNote: (id: string) => Promise<void>
}

export function DetailPanel({
  source,
  timelineEvent,
  timelineCluster,
  highlightedEventId,
  onClusterEventHighlight,
  onClose,
  subject,
  linkedinState,
  onSelectLinkedInResult,
  onRetryLinkedInSearch,
  stravaState,
  onSelectStravaResult,
  onRetryStravaSearch,
  krafmanState,
  twitterState,
  onSelectTwitterResult,
  onRetryTwitterSearch,
  onRefreshTwitter,
  githubState,
  onSelectGithubResult,
  onRetryGithubSearch,
  onRefreshGithub,
  breachState,
  notes,
  onCreateNote,
  onSaveNote,
  onDeleteNote,
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

  function renderTwitterContent(): ReactNode {
    if (!twitterState) return null
    switch (twitterState.status) {
      case "searching":
        return <LoadingSpinner text="Searching X..." />
      case "search-results":
        return (
          <TwitterSearchResultsList
            results={twitterState.results}
            searchQuery={twitterState.query}
            onSelect={onSelectTwitterResult}
            onRetry={onRetryTwitterSearch}
          />
        )
      case "syncing":
        return (
          <LoadingSpinner
            text={`Loading @${twitterState.username}...`}
          />
        )
      case "profile":
        return (
          <TwitterProfileContent
            profile={twitterState.profile}
            onRefresh={onRefreshTwitter}
          />
        )
      case "error":
        return (
          <p className="py-12 text-center text-xs text-red-400">
            {twitterState.message}
          </p>
        )
    }
  }

  function renderGithubContent(): ReactNode {
    if (!githubState) return null
    switch (githubState.status) {
      case "searching":
        return <LoadingSpinner text="Searching GitHub..." />
      case "search-results":
        return (
          <GithubSearchResultsList
            results={githubState.results}
            searchQuery={githubState.query}
            onSelect={onSelectGithubResult}
            onRetry={onRetryGithubSearch}
          />
        )
      case "syncing":
        return (
          <LoadingSpinner text={`Loading ${githubState.username}...`} />
        )
      case "profile":
        return (
          <GithubProfileContent
            profile={githubState.profile}
            onRefresh={onRefreshGithub}
          />
        )
      case "error":
        return (
          <p className="py-12 text-center text-xs text-red-400">
            {githubState.message}
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
        return twitterState?.status === "search-results"
          ? "X / TWITTER — SELECT ACCOUNT"
          : "X / TWITTER"
      case "github":
        return githubState?.status === "search-results"
          ? "GITHUB — SELECT USER"
          : "GITHUB"
      case "company":
        return "COMPANY"
      case "breach":
        return "BREACH"
      case "notes":
        return "NOTES"
      case "timeline-event":
        return "EVENT"
      case "timeline-cluster":
        return `CLUSTER — ${timelineCluster?.events.length ?? 0} EVENTS`
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
      case "company":
        return "bg-emerald-600/40"
      case "x":
        return "bg-sky-600/30"
      case "github":
        return "bg-[#238636]/35"
      case "breach":
        return "bg-red-600/40"
      case "notes":
        return "bg-amber-600/35"
      case "timeline-event": {
        if (!timelineEvent) return "bg-neutral-700/60"
        if (timelineEvent.kind.startsWith("linkedin")) return "bg-blue-600/40"
        if (timelineEvent.kind === "strava-activity") return "bg-orange-500/40"
        return "bg-neutral-700/60"
      }
      case "timeline-cluster":
        return "bg-neutral-700/60"
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
      case "company":
        return "text-emerald-500"
      case "x":
        return "text-sky-400"
      case "github":
        return "text-[#3fb950]"
      case "breach":
        return "text-red-500"
      case "notes":
        return "text-amber-400"
      case "timeline-event": {
        if (!timelineEvent) return "text-neutral-400"
        if (timelineEvent.kind.startsWith("linkedin")) return "text-blue-500"
        if (timelineEvent.kind === "strava-activity") return "text-orange-500"
        return "text-neutral-400"
      }
      case "timeline-cluster":
        return "text-neutral-400"
      default:
        return "text-neutral-400"
    }
  }

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

  function renderTimelineEventContent(): ReactNode {
    if (!timelineEvent) return null

    function formatDate(d: Date): string {
      return d.toLocaleDateString("en", { year: "numeric", month: "short", day: "numeric" })
    }

    function dateRangeLabel(start: Date, end: Date | null): string {
      return end ? `${formatDate(start)} — ${formatDate(end)}` : `${formatDate(start)} — Present`
    }

    switch (timelineEvent.kind) {
      case "linkedin-experience": {
        const exp = timelineEvent.payload
        return (
          <div className="space-y-5">
            <Section label="Position">
              <Card>
                <p className="text-sm font-medium text-neutral-200">{exp.positionTitle ?? "—"}</p>
                {exp.companyName && (
                  <p className="mt-0.5 text-xs text-neutral-500">{exp.companyName}</p>
                )}
                <p className="mt-1 text-[10px] text-neutral-600">
                  {dateRangeLabel(timelineEvent.startDate, timelineEvent.endDate)}
                </p>
                {exp.duration && (
                  <p className="text-[10px] text-neutral-600">{exp.duration}</p>
                )}
                {exp.location && (
                  <p className="mt-1 text-[10px] text-neutral-600">{exp.location}</p>
                )}
              </Card>
            </Section>
            {exp.description && (
              <Section label="Description">
                <p className="text-xs text-neutral-400 leading-relaxed whitespace-pre-wrap">{exp.description}</p>
              </Section>
            )}
          </div>
        )
      }

      case "linkedin-education": {
        const edu = timelineEvent.payload
        return (
          <div className="space-y-5">
            <Section label="Education">
              <Card>
                <p className="text-sm font-medium text-neutral-200">{edu.institutionName ?? "—"}</p>
                {edu.degree && (
                  <p className="mt-0.5 text-xs text-neutral-500">{edu.degree}</p>
                )}
                {edu.fieldOfStudy && (
                  <p className="text-xs text-neutral-500">{edu.fieldOfStudy}</p>
                )}
                <p className="mt-1 text-[10px] text-neutral-600">
                  {dateRangeLabel(timelineEvent.startDate, timelineEvent.endDate)}
                </p>
              </Card>
            </Section>
            {edu.description && (
              <Section label="Description">
                <p className="text-xs text-neutral-400 leading-relaxed whitespace-pre-wrap">{edu.description}</p>
              </Section>
            )}
          </div>
        )
      }

      case "linkedin-post": {
        const post = timelineEvent.payload
        return (
          <div className="space-y-5">
            <Section label="Post">
              <Card>
                <p className="text-xs text-neutral-300 leading-relaxed whitespace-pre-wrap">{post.text ?? "—"}</p>
                <p className="mt-2 text-[10px] text-neutral-600">{formatDate(timelineEvent.startDate)}</p>
              </Card>
            </Section>
            <Section label="Engagement">
              <div className="flex gap-5">
                {post.likes != null && (
                  <div>
                    <p className="font-mono text-xs text-neutral-200">{post.likes.toLocaleString()}</p>
                    <p className="text-[9px] tracking-widest text-neutral-600">LIKES</p>
                  </div>
                )}
                {post.comments != null && (
                  <div>
                    <p className="font-mono text-xs text-neutral-200">{post.comments.toLocaleString()}</p>
                    <p className="text-[9px] tracking-widest text-neutral-600">COMMENTS</p>
                  </div>
                )}
                {post.reposts != null && (
                  <div>
                    <p className="font-mono text-xs text-neutral-200">{post.reposts.toLocaleString()}</p>
                    <p className="text-[9px] tracking-widest text-neutral-600">REPOSTS</p>
                  </div>
                )}
              </div>
            </Section>
          </div>
        )
      }

      case "strava-activity": {
        const act = timelineEvent.payload
        return (
          <div className="space-y-5">
            <Section label="Activity">
              <Card>
                <p className="text-sm font-medium text-neutral-200">{act.title}</p>
                <p className="mt-0.5 text-xs text-neutral-500">{act.sportType}</p>
                <p className="mt-1 text-[10px] text-neutral-600">{formatDate(timelineEvent.startDate)}</p>
              </Card>
            </Section>
            <Section label="Stats">
              <div className="flex gap-5 flex-wrap">
                {act.distanceMeters != null && (
                  <div>
                    <p className="font-mono text-xs text-neutral-200">{formatDistance(act.distanceMeters)}</p>
                    <p className="text-[9px] tracking-widest text-neutral-600">DISTANCE</p>
                  </div>
                )}
                {act.movingTimeSeconds != null && (
                  <div>
                    <p className="font-mono text-xs text-neutral-200">{formatDuration(act.movingTimeSeconds)}</p>
                    <p className="text-[9px] tracking-widest text-neutral-600">MOVING TIME</p>
                  </div>
                )}
                {act.elevationMeters != null && (
                  <div>
                    <p className="font-mono text-xs text-neutral-200">{Math.round(act.elevationMeters)} m</p>
                    <p className="text-[9px] tracking-widest text-neutral-600">ELEVATION</p>
                  </div>
                )}
              </div>
            </Section>
            {act.activityUrl && (
              <a
                href={act.activityUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[10px] text-neutral-500 hover:text-neutral-300 transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                View on Strava
              </a>
            )}
          </div>
        )
      }

      case "twitter-tweet": {
        const tweet = timelineEvent.payload
        return (
          <div className="space-y-5">
            <Section label="Tweet">
              <Card>
                <p className="text-xs text-neutral-300 leading-relaxed whitespace-pre-wrap">{tweet.text}</p>
                <p className="mt-2 text-[10px] text-neutral-600">{formatDate(timelineEvent.startDate)}</p>
              </Card>
            </Section>
            <Section label="Engagement">
              <div className="flex gap-5 flex-wrap">
                <div>
                  <p className="font-mono text-xs text-neutral-200">{tweet.likes.toLocaleString()}</p>
                  <p className="text-[9px] tracking-widest text-neutral-600">LIKES</p>
                </div>
                <div>
                  <p className="font-mono text-xs text-neutral-200">{tweet.retweets.toLocaleString()}</p>
                  <p className="text-[9px] tracking-widest text-neutral-600">RETWEETS</p>
                </div>
                <div>
                  <p className="font-mono text-xs text-neutral-200">{tweet.replies.toLocaleString()}</p>
                  <p className="text-[9px] tracking-widest text-neutral-600">REPLIES</p>
                </div>
                <div>
                  <p className="font-mono text-xs text-neutral-200">{tweet.views.toLocaleString()}</p>
                  <p className="text-[9px] tracking-widest text-neutral-600">VIEWS</p>
                </div>
              </div>
            </Section>
          </div>
        )
      }
    }
  }

  function renderTimelineClusterContent(): ReactNode {
    if (!timelineCluster) return null
    const { events } = timelineCluster

    function kindLabel(ev: TimelineEvent): string {
      switch (ev.kind) {
        case "linkedin-experience": return "EXPERIENCE"
        case "linkedin-education": return "EDUCATION"
        case "linkedin-post": return "POST"
        case "strava-activity": return ev.payload.sportType.toUpperCase()
        case "twitter-tweet": return "TWEET"
      }
    }

    function kindColor(ev: TimelineEvent): string {
      if (ev.kind.startsWith("linkedin")) return "text-blue-500"
      if (ev.kind === "strava-activity") return "text-orange-500"
      return "text-neutral-500"
    }

    function fmtDate(d: Date): string {
      return d.toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })
    }

    return (
      <div className="space-y-2">
        {events.map((ev) => (
          <button
            key={ev.id}
            type="button"
            onClick={() => onClusterEventHighlight?.(ev.id)}
            className={cn(
              "w-full rounded-lg border px-3 py-2.5 text-left transition-all",
              "border-neutral-800 bg-neutral-900/40 hover:border-neutral-700",
              highlightedEventId === ev.id && "border-blue-600/60 ring-1 ring-blue-600/30"
            )}
          >
            <p className={cn("font-mono text-[9px] tracking-widest mb-1", kindColor(ev))}>
              {kindLabel(ev)}
            </p>
            <p className="text-xs text-neutral-300 truncate">{ev.label}</p>
            <p className="mt-0.5 font-mono text-[10px] text-neutral-600">{fmtDate(ev.startDate)}</p>
          </button>
        ))}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "fixed inset-y-0 right-0 z-40 flex w-[420px] flex-col bg-background",
        "border-l border-neutral-200 dark:border-neutral-800",
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
          className="rounded-md p-1 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-600 dark:hover:bg-neutral-900 dark:hover:text-neutral-300"
          aria-label="Close panel"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="h-px shrink-0 bg-neutral-200 dark:bg-neutral-800" />

      <div className="scrollbar-none flex-1 overflow-y-auto px-6 py-7">
        {source === "subject" && <SubjectContent subject={subject} />}
        {source === "linkedin" && renderLinkedinContent()}
        {source === "strava" && renderStravaContent()}
        {source === "x" && renderTwitterContent()}
        {source === "github" && renderGithubContent()}
        {source === "company" && renderKrafmanContent()}
        {source === "breach" && renderBreachContent()}
        {source === "notes" && (
          <NotesPanelContent
            notes={notes}
            onCreateNote={onCreateNote}
            onSaveNote={onSaveNote}
            onDeleteNote={onDeleteNote}
          />
        )}
        {source === "timeline-event" && renderTimelineEventContent()}
        {source === "timeline-cluster" && renderTimelineClusterContent()}
      </div>
    </div>
  )
}
