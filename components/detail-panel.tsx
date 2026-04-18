"use client"

import type { ReactNode } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import linkedinData from "@/data/mock/linkedin.json"
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

function LinkedinContent() {
  const d = linkedinData.profile

  return (
    <div className="space-y-8">
      {/* Identity */}
      <div>
        <h3 className="text-xl font-light text-foreground">{d.name}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-neutral-400">{d.headline}</p>
        <p className="mt-2.5 text-[11px] text-neutral-600">
          {d.location} · {d.connections} connections · {d.followers} followers
        </p>
      </div>

      <Section label="About">
        <p className="text-sm leading-relaxed text-neutral-400">{d.about}</p>
      </Section>

      <Section label="Current Position">
        <Card>
          <p className="text-sm text-foreground">{d.current_position.title}</p>
          <p className="mt-1 text-xs text-neutral-500">{d.current_position.company}</p>
          <p className="mt-0.5 text-[11px] text-neutral-700">
            {d.current_position.location} · {d.current_position.start_date} – present
          </p>
        </Card>
      </Section>

      <Section label="Experience">
        <div className="space-y-2">
          {d.experience.map((exp, i) => (
            <Card key={i}>
              <p className="text-sm text-foreground">{exp.title}</p>
              <p className="mt-1 text-xs text-neutral-500">{exp.company}</p>
              <p className="mt-0.5 text-[11px] text-neutral-700">{exp.location} · {exp.duration}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section label="Education">
        <div className="space-y-2">
          {d.education.map((edu, i) => (
            <Card key={i}>
              <p className="text-sm text-foreground">{edu.school}</p>
              <p className="mt-1 text-xs text-neutral-500">{edu.degree}</p>
              <p className="mt-0.5 text-[11px] text-neutral-700">{edu.years}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section label="Skills">
        <div className="flex flex-wrap gap-1.5">
          {d.skills.map((skill) => (
            <span
              key={skill}
              className="rounded-md border border-neutral-800 bg-neutral-900/60 px-2.5 py-1 text-[11px] text-neutral-400"
            >
              {skill}
            </span>
          ))}
        </div>
      </Section>

      <Section label="Languages">
        <div className="space-y-1.5">
          {d.languages.map((lang) => (
            <p key={lang} className="text-xs text-neutral-500">{lang}</p>
          ))}
        </div>
      </Section>

      <Section label="Certifications">
        {d.certifications.map((cert, i) => (
          <Card key={i}>
            <p className="text-sm text-foreground">{cert.name}</p>
            <p className="mt-1 text-xs text-neutral-500">{cert.issuer} · {cert.year}</p>
          </Card>
        ))}
      </Section>
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

interface DetailPanelProps {
  source: "linkedin" | "x" | null
  onClose: () => void
}

export function DetailPanel({ source, onClose }: DetailPanelProps) {
  const open = source !== null

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
          {source === "linkedin" ? "LINKEDIN" : source === "x" ? "X / TWITTER" : ""}
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
        {source === "linkedin" && <LinkedinContent />}
        {source === "x" && <XContent />}
      </div>
    </div>
  )
}
