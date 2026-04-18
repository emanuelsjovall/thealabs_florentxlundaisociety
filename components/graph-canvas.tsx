"use client"

import { useState, useEffect, useRef } from "react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { Sun, Moon } from "lucide-react"
import type { LinkedInProfile } from "@/lib/linkedin"
import type { StravaProfile } from "@/lib/strava"
import type { KrafmanCompanyProfile } from "@/lib/krafman.types"
import type { UserGithubProfile, UserTwitterProfile } from "@/lib/user-record"
import type { BreachSearchResult } from "@/lib/breach"

function LinkedinNode({
  onSelect,
  profile,
}: {
  onSelect: () => void
  profile: LinkedInProfile | null
}) {
  const d = profile

  return (
    <div
      onClick={onSelect}
      onMouseDown={(e) => e.stopPropagation()}
      className="w-60 cursor-pointer rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition-colors hover:border-neutral-300 dark:border-neutral-800 dark:bg-[#0b0b0b] dark:shadow-none dark:hover:border-neutral-600"
    >
      <div className="mb-3">
        <span className="font-mono text-[10px] tracking-[0.2em] text-blue-500">
          LINKEDIN
        </span>
      </div>
      {d ? (
        <>
          <p className="text-base font-light text-foreground">{d.name}</p>
          <p className="mt-1 line-clamp-2 text-xs leading-snug text-neutral-500">
            {d.headline}
          </p>
          <div className="mt-3 space-y-1.5">
            {d.experiences[0] && (
              <p className="text-xs text-neutral-500">
                {d.experiences[0].positionTitle} ·{" "}
                {d.experiences[0].companyName}
              </p>
            )}
            {d.location && (
              <p className="text-xs text-neutral-600">{d.location}</p>
            )}
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-neutral-500">Click to search</p>
          <p className="mt-1 text-xs text-neutral-700">
            Find matching profiles
          </p>
        </>
      )}
    </div>
  )
}

function StravaNode({
  onSelect,
  profile,
}: {
  onSelect: () => void
  profile: StravaProfile | null
}) {
  const d = profile

  return (
    <div
      onClick={onSelect}
      onMouseDown={(e) => e.stopPropagation()}
      className="w-60 cursor-pointer rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition-colors hover:border-neutral-300 dark:border-neutral-800 dark:bg-[#0b0b0b] dark:shadow-none dark:hover:border-neutral-600"
    >
      <div className="mb-3">
        <span className="font-mono text-[10px] tracking-[0.2em] text-orange-500">
          STRAVA
        </span>
      </div>
      {d ? (
        <>
          <p className="text-base font-light text-foreground">{d.name}</p>
          <div className="mt-3 space-y-1.5">
            <p className="text-xs text-neutral-500">
              {d.totalActivities} activities
            </p>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-neutral-500">Click to search</p>
          <p className="mt-1 text-xs text-neutral-700">
            Find matching athletes
          </p>
        </>
      )}
    </div>
  )
}

function CompanyNode({
  onSelect,
  profile,
}: {
  onSelect: () => void
  profile: KrafmanCompanyProfile | null
}) {
  const d = profile

  return (
    <div
      onClick={onSelect}
      onMouseDown={(e) => e.stopPropagation()}
      className="w-60 cursor-pointer rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition-colors hover:border-neutral-300 dark:border-neutral-800 dark:bg-[#0b0b0b] dark:shadow-none dark:hover:border-neutral-600"
    >
      <div className="mb-3">
        <span className="font-mono text-[10px] tracking-[0.2em] text-emerald-500">
          COMPANY
        </span>
      </div>
      {d ? (
        <>
          <p className="text-base font-light text-foreground">
            {d.companyName}
          </p>
          <div className="mt-3 space-y-1.5">
            {d.orgNumber && (
              <p className="font-mono text-xs text-neutral-500">
                {d.orgNumber}
              </p>
            )}
            {d.status && (
              <span
                className={cn(
                  "inline-block rounded px-1.5 py-0.5 text-[10px]",
                  d.status.toLowerCase() === "aktiv"
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-red-500/10 text-red-400"
                )}
              >
                {d.status}
              </span>
            )}
            {d.industry && (
              <p className="text-xs text-neutral-600">{d.industry}</p>
            )}
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-neutral-500">Loading...</p>
          <p className="mt-1 text-xs text-neutral-700">
            Company details via Krafman
          </p>
        </>
      )}
    </div>
  )
}

function NotesNode({
  onSelect,
  noteCount,
  previewLine,
}: {
  onSelect: () => void
  noteCount: number
  previewLine: string | null
}) {
  return (
    <div
      onClick={onSelect}
      onMouseDown={(e) => e.stopPropagation()}
      className="w-60 cursor-pointer rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition-colors hover:border-neutral-300 dark:border-neutral-800 dark:bg-[#0b0b0b] dark:shadow-none dark:hover:border-neutral-600"
    >
      <div className="mb-3">
        <span className="font-mono text-[10px] tracking-[0.2em] text-amber-400">
          NOTES
        </span>
      </div>
      {noteCount > 0 ? (
        <>
          <p className="text-base font-light text-foreground">
            {noteCount} note{noteCount !== 1 ? "s" : ""}
          </p>
          {previewLine ? (
            <p className="mt-1 line-clamp-2 text-xs leading-snug text-neutral-500">
              {previewLine}
            </p>
          ) : (
            <p className="mt-1 text-xs text-neutral-600">Personal notes</p>
          )}
        </>
      ) : (
        <>
          <p className="text-sm text-neutral-500">Click to open</p>
          <p className="mt-1 text-xs text-neutral-700">
            Add free-text notes for this subject
          </p>
        </>
      )}
    </div>
  )
}

function BreachNode({
  onSelect,
  result,
}: {
  onSelect: () => void
  result: BreachSearchResult | null
}) {
  return (
    <div
      onClick={onSelect}
      onMouseDown={(e) => e.stopPropagation()}
      className="w-60 cursor-pointer rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition-colors hover:border-neutral-300 dark:border-neutral-800 dark:bg-[#0b0b0b] dark:shadow-none dark:hover:border-neutral-600"
    >
      <div className="mb-3">
        <span className="font-mono text-[10px] tracking-[0.2em] text-red-500">
          BREACH
        </span>
      </div>
      {result ? (
        <>
          <p className="text-base font-light text-foreground">
            {result.count} record{result.count !== 1 ? "s" : ""}
          </p>
          <p className="mt-1 text-xs text-neutral-600">
            searched for &ldquo;{result.term}&rdquo;
          </p>
        </>
      ) : (
        <>
          <p className="text-sm text-neutral-500">Click to search</p>
          <p className="mt-1 text-xs text-neutral-700">
            Check data breach records
          </p>
        </>
      )}
    </div>
  )
}

function XNode({
  onSelect,
  profile,
}: {
  onSelect: () => void
  profile: UserTwitterProfile | null
}) {
  const d = profile

  return (
    <div
      onClick={onSelect}
      onMouseDown={(e) => e.stopPropagation()}
      className="w-60 cursor-pointer rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition-colors hover:border-neutral-300 dark:border-neutral-800 dark:bg-[#0b0b0b] dark:shadow-none dark:hover:border-neutral-600"
    >
      <div className="mb-3">
        <span className="font-mono text-[10px] tracking-[0.2em] text-neutral-400">
          X / TWITTER
        </span>
      </div>
      {d ? (
        <>
          <p className="text-base font-light text-foreground">{d.handle}</p>
          <p className="mt-1 line-clamp-2 text-xs leading-snug text-neutral-500">
            {d.bio}
          </p>
          <div className="mt-3 space-y-1.5">
            <p className="text-xs text-neutral-500">
              {d.followers.toLocaleString()} followers ·{" "}
              {d.following.toLocaleString()} following
            </p>
            <p className="text-xs text-neutral-600">
              {d.tweets_count.toLocaleString()} tweets
            </p>
            <p className="text-xs text-neutral-600">{d.location}</p>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-neutral-500">Click to search</p>
          <p className="mt-1 text-xs text-neutral-700">
            Find matching accounts
          </p>
        </>
      )}
    </div>
  )
}

function GithubNode({
  onSelect,
  profile,
}: {
  onSelect: () => void
  profile: UserGithubProfile | null
}) {
  const d = profile

  return (
    <div
      onClick={onSelect}
      onMouseDown={(e) => e.stopPropagation()}
      className="w-60 cursor-pointer rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition-colors hover:border-neutral-300 dark:border-neutral-800 dark:bg-[#0b0b0b] dark:shadow-none dark:hover:border-neutral-600"
    >
      <div className="mb-3">
        <span className="font-mono text-[10px] tracking-[0.2em] text-[#3fb950]">
          GITHUB
        </span>
      </div>
      {d ? (
        <>
          <p className="font-mono text-base font-light text-foreground">
            {d.login}
          </p>
          <p className="mt-1 line-clamp-2 text-xs leading-snug text-neutral-500">
            {d.bio ?? d.name ?? ""}
          </p>
          <div className="mt-3 space-y-1.5">
            <p className="text-xs text-neutral-500">
              {d.public_repos.toLocaleString()} public repos ·{" "}
              {d.followers.toLocaleString()} followers
            </p>
            {d.location ? (
              <p className="text-xs text-neutral-600">{d.location}</p>
            ) : null}
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-neutral-500">Click to search</p>
          <p className="mt-1 text-xs text-neutral-700">
            Find GitHub users (API)
          </p>
        </>
      )}
    </div>
  )
}

interface Viewport {
  scale: number
  x: number
  y: number
}

interface GraphCanvasProps {
  onSelect: (
    source:
      | "linkedin"
      | "x"
      | "github"
      | "strava"
      | "company"
      | "breach"
      | "notes"
  ) => void
  onDeselect: () => void
  linkedinProfile: LinkedInProfile | null
  twitterProfile: UserTwitterProfile | null
  githubProfile: UserGithubProfile | null
  stravaProfile: StravaProfile | null
  krafmanProfile: KrafmanCompanyProfile | null
  showCompanyNode: boolean
  breachResult: BreachSearchResult | null
  noteCount: number
  notesPreviewLine: string | null
}

const WORLD_W = 1400
const WORLD_H = 900

export function GraphCanvas({
  onSelect,
  onDeselect,
  linkedinProfile,
  twitterProfile,
  githubProfile,
  stravaProfile,
  krafmanProfile,
  showCompanyNode,
  breachResult,
  noteCount,
  notesPreviewLine,
}: GraphCanvasProps) {
  const [showLinkedin, setShowLinkedin] = useState(false)
  const [showX, setShowX] = useState(false)
  const [showGithub, setShowGithub] = useState(false)
  const [showStrava, setShowStrava] = useState(false)
  const [showCompany, setShowCompany] = useState(false)
  const [showBreach, setShowBreach] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [viewport, setViewport] = useState<Viewport>({ scale: 0.7, x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{
    startX: number
    startY: number
    hasMoved: boolean
  } | null>(null)
  const hasInteracted = useRef(false)
  const { resolvedTheme, setTheme } = useTheme()

  useEffect(() => {
    const t1 = setTimeout(() => setShowLinkedin(true), 600)
    const t2 = setTimeout(() => setShowX(true), 2400)
    const t3 = setTimeout(() => setShowStrava(true), 1500)
    const t5 = setTimeout(() => setShowBreach(true), 1800)
    const t6 = setTimeout(() => setShowNotes(true), 1200)
    const t7 = setTimeout(() => setShowGithub(true), 2100)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t5)
      clearTimeout(t6)
      clearTimeout(t7)
    }
  }, [])

  useEffect(() => {
    if (showCompanyNode) {
      const t = setTimeout(() => setShowCompany(true), 400)
      return () => clearTimeout(t)
    }
    setShowCompany(false)
  }, [showCompanyNode])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    function fitToCanvas(w: number, h: number) {
      if (hasInteracted.current) return
      const scale = Math.min((w * 0.9) / WORLD_W, (h * 0.9) / WORLD_H)
      setViewport({
        scale,
        x: (w - WORLD_W * scale) / 2,
        y: (h - WORLD_H * scale) / 2,
      })
    }

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) fitToCanvas(entry.contentRect.width, entry.contentRect.height)
    })
    ro.observe(canvas)

    const { width, height } = canvas.getBoundingClientRect()
    fitToCanvas(width, height)

    return () => ro.disconnect()
  }, [])

  // Block native scroll on the canvas so the page never scrolls while hovering the graph
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const prevent = (e: WheelEvent) => e.preventDefault()
    canvas.addEventListener("wheel", prevent, { passive: false })
    return () => canvas.removeEventListener("wheel", prevent)
  }, [])

  function onMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if (e.button !== 0) return
    hasInteracted.current = true
    dragRef.current = {
      startX: e.clientX - viewport.x,
      startY: e.clientY - viewport.y,
      hasMoved: false,
    }
    setIsDragging(true)
  }

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const drag = dragRef.current
    if (!drag) return
    drag.hasMoved = true
    setViewport((prev) => ({
      ...prev,
      x: e.clientX - drag.startX,
      y: e.clientY - drag.startY,
    }))
  }

  function onMouseUp() {
    if (dragRef.current && !dragRef.current.hasMoved) {
      onDeselect()
    }
    dragRef.current = null
    setIsDragging(false)
  }

  const ZOOM_LEVELS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4]

  function zoomTo(newScale: number) {
    const canvas = canvasRef.current
    if (!canvas) return
    const { width, height } = canvas.getBoundingClientRect()
    const cx = width / 2
    const cy = height / 2
    setViewport((prev) => {
      const ratio = newScale / prev.scale
      return {
        scale: newScale,
        x: cx - (cx - prev.x) * ratio,
        y: cy - (cy - prev.y) * ratio,
      }
    })
  }

  function zoomIn() {
    hasInteracted.current = true
    const next = ZOOM_LEVELS.find((l) => l > viewport.scale + 0.01)
    if (next) zoomTo(next)
  }

  function zoomOut() {
    hasInteracted.current = true
    const prev = [...ZOOM_LEVELS]
      .reverse()
      .find((l) => l < viewport.scale - 0.01)
    if (prev) zoomTo(prev)
  }

  return (
    <div
      ref={canvasRef}
      className={cn(
        "relative h-full w-full overflow-hidden select-none",
        isDragging ? "cursor-grabbing" : "cursor-grab"
      )}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      {/* Zoomable / pannable layer */}
      <div
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
          transformOrigin: "0 0",
          willChange: "transform",
          transition: isDragging
            ? "none"
            : "transform 350ms cubic-bezier(0.4, 0, 0.2, 1)",
          position: "absolute",
          top: 0,
          left: 0,
          width: `${WORLD_W}px`,
          height: `${WORLD_H}px`,
        }}
      >
        {/* Connecting lines */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full">
          <line
            x1="50%"
            y1="50%"
            x2="30%"
            y2="32%"
            stroke="var(--graph-line)"
            strokeWidth="1"
            strokeDasharray="3 6"
            className={cn(
              "transition-opacity duration-700",
              showLinkedin ? "opacity-100" : "opacity-0"
            )}
          />
          <line
            x1="50%"
            y1="50%"
            x2="67%"
            y2="63%"
            stroke="var(--graph-line)"
            strokeWidth="1"
            strokeDasharray="3 6"
            className={cn(
              "transition-opacity duration-700",
              showX ? "opacity-100" : "opacity-0"
            )}
          />
          <line
            x1="50%"
            y1="50%"
            x2="7%"
            y2="44%"
            stroke="var(--graph-line)"
            strokeWidth="1"
            strokeDasharray="3 6"
            className={cn(
              "transition-opacity duration-700",
              showGithub ? "opacity-100" : "opacity-0"
            )}
          />
          <line
            x1="50%"
            y1="50%"
            x2="76%"
            y2="32%"
            stroke="var(--graph-line)"
            strokeWidth="1"
            strokeDasharray="3 6"
            className={cn(
              "transition-opacity duration-700",
              showStrava ? "opacity-100" : "opacity-0"
            )}
          />
          <line
            x1="50%"
            y1="50%"
            x2="50%"
            y2="18%"
            stroke="var(--graph-line)"
            strokeWidth="1"
            strokeDasharray="3 6"
            className={cn(
              "transition-opacity duration-700",
              showBreach ? "opacity-100" : "opacity-0"
            )}
          />
          <line
            x1="50%"
            y1="50%"
            x2="22%"
            y2="88%"
            stroke="var(--graph-line)"
            strokeWidth="1"
            strokeDasharray="3 6"
            className={cn(
              "transition-opacity duration-700",
              showNotes ? "opacity-100" : "opacity-0"
            )}
          />
          {showCompanyNode && (
            <line
              x1="34%"
              y1="65%"
              x2="52%"
              y2="82%"
              stroke="var(--graph-line)"
              strokeWidth="1"
              strokeDasharray="3 6"
              className={cn(
                "transition-opacity duration-700",
                showCompany ? "opacity-100" : "opacity-0"
              )}
            />
          )}
        </svg>

        {/* Center dot */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="h-1.5 w-1.5 rounded-full bg-neutral-900 opacity-15 dark:bg-white" />
        </div>

        {/* LinkedIn node */}
        <div className="absolute top-[32%] left-[30%] -translate-x-1/2 -translate-y-1/2">
          <div
            className={cn(
              "transition-all duration-500 ease-out",
              showLinkedin
                ? "translate-y-0 opacity-100"
                : "pointer-events-none translate-y-3 opacity-0"
            )}
          >
            <LinkedinNode
              onSelect={() => onSelect("linkedin")}
              profile={linkedinProfile}
            />
          </div>
        </div>

        {/* X node */}
        <div className="absolute top-[63%] left-[67%] -translate-x-1/2 -translate-y-1/2">
          <div
            className={cn(
              "transition-all duration-500 ease-out",
              showX
                ? "translate-y-0 opacity-100"
                : "pointer-events-none translate-y-3 opacity-0"
            )}
          >
            <XNode onSelect={() => onSelect("x")} profile={twitterProfile} />
          </div>
        </div>

        {/* GitHub node */}
        <div className="absolute top-[44%] left-[7%] -translate-x-1/2 -translate-y-1/2">
          <div
            className={cn(
              "transition-all duration-500 ease-out",
              showGithub
                ? "translate-y-0 opacity-100"
                : "pointer-events-none translate-y-3 opacity-0"
            )}
          >
            <GithubNode
              onSelect={() => onSelect("github")}
              profile={githubProfile}
            />
          </div>
        </div>

        {/* Strava node */}
        <div className="absolute top-[32%] left-[76%] -translate-x-1/2 -translate-y-1/2">
          <div
            className={cn(
              "transition-all duration-500 ease-out",
              showStrava
                ? "translate-y-0 opacity-100"
                : "pointer-events-none translate-y-3 opacity-0"
            )}
          >
            <StravaNode
              onSelect={() => onSelect("strava")}
              profile={stravaProfile}
            />
          </div>
        </div>

        {/* Notes node */}
        <div className="absolute top-[88%] left-[22%] -translate-x-1/2 -translate-y-1/2">
          <div
            className={cn(
              "transition-all duration-500 ease-out",
              showNotes
                ? "translate-y-0 opacity-100"
                : "pointer-events-none translate-y-3 opacity-0"
            )}
          >
            <NotesNode
              onSelect={() => onSelect("notes")}
              noteCount={noteCount}
              previewLine={notesPreviewLine}
            />
          </div>
        </div>

        {/* Breach node */}
        <div className="absolute top-[18%] left-[50%] -translate-x-1/2 -translate-y-1/2">
          <div
            className={cn(
              "transition-all duration-500 ease-out",
              showBreach
                ? "translate-y-0 opacity-100"
                : "pointer-events-none translate-y-3 opacity-0"
            )}
          >
            <BreachNode
              onSelect={() => onSelect("breach")}
              result={breachResult}
            />
          </div>
        </div>

        {/* Company node (when active company / Krafman data exists) */}
        {showCompanyNode && (
          <div className="absolute top-[82%] left-[52%] -translate-x-1/2 -translate-y-1/2">
            <div
              className={cn(
                "transition-all duration-500 ease-out",
                showCompany
                  ? "translate-y-0 opacity-100"
                  : "pointer-events-none translate-y-3 opacity-0"
              )}
            >
              <CompanyNode
                onSelect={() => onSelect("company")}
                profile={krafmanProfile}
              />
            </div>
          </div>
        )}
      </div>

      {/* Zoom controls */}
      <div
        className="absolute top-5 left-5 flex items-center gap-2"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          onClick={zoomOut}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-lg leading-none text-neutral-700 shadow-sm transition-colors hover:bg-neutral-50 hover:text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:shadow-none dark:hover:bg-neutral-800 dark:hover:text-white"
          aria-label="Zoom out"
        >
          −
        </button>
        <span className="w-12 text-center font-mono text-xs text-neutral-500 tabular-nums select-none dark:text-neutral-400">
          {Math.round(viewport.scale * 100)}%
        </span>
        <button
          onClick={zoomIn}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-lg leading-none text-neutral-700 shadow-sm transition-colors hover:bg-neutral-50 hover:text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:shadow-none dark:hover:bg-neutral-800 dark:hover:text-white"
          aria-label="Zoom in"
        >
          +
        </button>
        <div className="mx-1 h-5 w-px bg-neutral-200 dark:bg-neutral-700" />
        <button
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-500 shadow-sm transition-colors hover:bg-neutral-50 hover:text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400 dark:shadow-none dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
          aria-label="Toggle theme"
        >
          {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}
