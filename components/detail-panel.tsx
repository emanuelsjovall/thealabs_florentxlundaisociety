"use client"

import type { ReactNode } from "react"
import { X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { LinkedInProfile, LinkedInSearchResult } from "@/lib/linkedin"
import xData from "@/data/mock/x.json"

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-[9px] uppercase tracking-[0.22em] text-neutral-700">{label}</p>
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

function SearchResultsList({
  results,
  onSelect,
}: {
  results: readonly LinkedInSearchResult[]
  onSelect: (result: LinkedInSearchResult) => void
}) {
  if (results.length === 0) {
    return (
      <p className="py-12 text-center text-xs text-neutral-600">
        No matches found
      </p>
    )
  }

  return (
    <div className="space-y-1">
      <p className="mb-4 text-[10px] text-neutral-600">
        {results.length} potential {results.length === 1 ? "match" : "matches"}
      </p>
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

function LinkedinProfileContent({ profile }: { profile: LinkedInProfile }) {
  const currentExp = profile.experiences[0]

  return (
    <div className="space-y-8">
      {/* Identity */}
      <div>
        <h3 className="text-xl font-light text-foreground">{profile.name}</h3>
        {profile.headline && (
          <p className="mt-1.5 text-sm leading-relaxed text-neutral-400">{profile.headline}</p>
        )}
        {profile.location && (
          <p className="mt-2.5 text-[11px] text-neutral-600">{profile.location}</p>
        )}
      </div>

      {profile.about && (
        <Section label="About">
          <p className="text-sm leading-relaxed text-neutral-400">{profile.about}</p>
        </Section>
      )}

      {currentExp && (
        <Section label="Current Position">
          <Card>
            <p className="text-sm text-foreground">{currentExp.positionTitle}</p>
            {currentExp.companyName && (
              <p className="mt-1 text-xs text-neutral-500">{currentExp.companyName}</p>
            )}
            <p className="mt-0.5 text-[11px] text-neutral-700">
              {[currentExp.location, currentExp.fromDate && `${currentExp.fromDate} – ${currentExp.toDate ?? "present"}`]
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
                  <p className="mt-1 text-xs text-neutral-500">{exp.companyName}</p>
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
    </div>
  )
}

function XContent() {
  const d = xData.profile

  return (
    <div className="space-y-8">
      {/* Identity */}
      <div>
        <h3 className="text-xl font-light text-foreground">{d.handle}</h3>
        <p className="mt-1 text-sm text-neutral-400">{d.name}</p>
        <p className="mt-2 text-sm leading-relaxed text-neutral-500">{d.bio}</p>
        <p className="mt-2.5 text-[11px] text-neutral-600">
          {d.location} · {d.website} · joined {new Date(d.joined).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
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
              <p className="text-sm leading-relaxed text-neutral-300">{tweet.text}</p>
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

type LinkedInPanelState =
  | { status: "searching" }
  | { status: "search-results"; results: readonly LinkedInSearchResult[] }
  | { status: "scraping"; name: string }
  | { status: "profile"; profile: LinkedInProfile }
  | { status: "error"; message: string }

interface DetailPanelProps {
  source: "linkedin" | "x" | null
  onClose: () => void
  linkedinState: LinkedInPanelState | null
  onSelectSearchResult: (result: LinkedInSearchResult) => void
}

export function DetailPanel({
  source,
  onClose,
  linkedinState,
  onSelectSearchResult,
}: DetailPanelProps) {
  const open = source !== null

  function renderLinkedinContent(): ReactNode {
    if (!linkedinState) return null

    switch (linkedinState.status) {
      case "searching":
        return <LoadingSpinner text="Searching LinkedIn..." />
      case "search-results":
        return (
          <SearchResultsList
            results={linkedinState.results}
            onSelect={onSelectSearchResult}
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

  const panelTitle =
    source === "linkedin"
      ? linkedinState?.status === "search-results"
        ? "LINKEDIN — SELECT PROFILE"
        : "LINKEDIN"
      : source === "x"
        ? "X / TWITTER"
        : ""

  return (
    <div
      className={cn(
        "fixed inset-y-0 right-0 z-40 flex w-[420px] flex-col bg-background",
        "border-l border-neutral-800",
        "transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
        open ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      )}
    >
      {/* Accent line at top — colored per source */}
      <div className={cn(
        "h-[2px] w-full shrink-0 transition-colors duration-300",
        source === "linkedin" ? "bg-blue-600/40" : "bg-neutral-700/60"
      )} />

      {/* Header */}
      <div className="flex shrink-0 items-center justify-between px-6 py-5">
        <span className={cn(
          "font-mono text-[9px] tracking-[0.25em]",
          source === "linkedin" ? "text-blue-500" : "text-neutral-400"
        )}>
          {panelTitle}
        </span>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-neutral-600 transition-colors hover:bg-neutral-900 hover:text-neutral-300"
          aria-label="Close panel"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Divider */}
      <div className="h-px bg-neutral-800 shrink-0" />

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-6 py-7 scrollbar-none">
        {source === "linkedin" && renderLinkedinContent()}
        {source === "x" && <XContent />}
      </div>
    </div>
  )
}
