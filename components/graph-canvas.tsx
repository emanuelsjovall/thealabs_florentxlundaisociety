"use client"

import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import type { LinkedInProfile } from "@/lib/linkedin"
import type { StravaProfile } from "@/lib/strava"
import type { MrkollProfile } from "@/lib/mrkoll.types"
import type { KrafmanCompanyProfile } from "@/lib/krafman.types"
import type { UserTwitterProfile } from "@/lib/user-record"
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
      className="w-60 cursor-pointer rounded-xl border border-neutral-800 bg-[#0b0b0b] p-4 transition-colors hover:border-neutral-600"
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
      className="w-60 cursor-pointer rounded-xl border border-neutral-800 bg-[#0b0b0b] p-4 transition-colors hover:border-neutral-600"
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

function MrkollNode({
  onSelect,
  profile,
}: {
  onSelect: () => void
  profile: MrkollProfile | null
}) {
  const d = profile

  return (
    <div
      onClick={onSelect}
      onMouseDown={(e) => e.stopPropagation()}
      className="w-60 cursor-pointer rounded-xl border border-neutral-800 bg-[#0b0b0b] p-4 transition-colors hover:border-neutral-600"
    >
      <div className="mb-3">
        <span className="font-mono text-[10px] tracking-[0.2em] text-purple-500">
          MRKOLL
        </span>
      </div>
      {d ? (
        <>
          <p className="text-base font-light text-foreground">{d.name}</p>
          <div className="mt-3 space-y-1.5">
            {d.age != null && (
              <p className="text-xs text-neutral-500">{d.age} years old</p>
            )}
            {d.address && (
              <p className="text-xs text-neutral-600">{d.address}</p>
            )}
            {d.companies.length > 0 && (
              <p className="text-xs text-neutral-500">
                {d.companies.length}{" "}
                {d.companies.length === 1 ? "company" : "companies"}
              </p>
            )}
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-neutral-500">Click to search</p>
          <p className="mt-1 text-xs text-neutral-700">
            Swedish public records
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
      className="w-60 cursor-pointer rounded-xl border border-neutral-800 bg-[#0b0b0b] p-4 transition-colors hover:border-neutral-600"
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
      className="w-60 cursor-pointer rounded-xl border border-neutral-800 bg-[#0b0b0b] p-4 transition-colors hover:border-neutral-600"
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
      className="w-60 cursor-pointer rounded-xl border border-neutral-800 bg-[#0b0b0b] p-4 transition-colors hover:border-neutral-600"
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

interface Viewport {
  scale: number
  x: number
  y: number
}

interface GraphCanvasProps {
  onSelect: (source: "linkedin" | "x" | "strava" | "mrkoll" | "company" | "breach") => void
  onDeselect: () => void
  linkedinProfile: LinkedInProfile | null
  twitterProfile: UserTwitterProfile | null
  stravaProfile: StravaProfile | null
  mrkollProfile: MrkollProfile | null
  krafmanProfile: KrafmanCompanyProfile | null
  showCompanyNode: boolean
  breachResult: BreachSearchResult | null
}

export function GraphCanvas({
  onSelect,
  onDeselect,
  linkedinProfile,
  twitterProfile,
  stravaProfile,
  mrkollProfile,
  krafmanProfile,
  showCompanyNode,
  breachResult,
}: GraphCanvasProps) {
  const [showLinkedin, setShowLinkedin] = useState(false)
  const [showX, setShowX] = useState(false)
  const [showStrava, setShowStrava] = useState(false)
  const [showMrkoll, setShowMrkoll] = useState(false)
  const [showCompany, setShowCompany] = useState(false)
  const [showBreach, setShowBreach] = useState(false)
  const [viewport, setViewport] = useState<Viewport>({ scale: 1, x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{
    startX: number
    startY: number
    hasMoved: boolean
  } | null>(null)

  useEffect(() => {
    const t1 = setTimeout(() => setShowLinkedin(true), 600)
    const t2 = setTimeout(() => setShowX(true), 2400)
    const t3 = setTimeout(() => setShowStrava(true), 1500)
    const t4 = setTimeout(() => setShowMrkoll(true), 1000)
    const t5 = setTimeout(() => setShowBreach(true), 1800)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
      clearTimeout(t5)
    }
  }, [])

  useEffect(() => {
    if (showCompanyNode) {
      const t = setTimeout(() => setShowCompany(true), 400)
      return () => clearTimeout(t)
    }
    setShowCompany(false)
  }, [showCompanyNode])

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
    dragRef.current = {
      startX: e.clientX - viewport.x,
      startY: e.clientY - viewport.y,
      hasMoved: false,
    }
    setIsDragging(true)
  }

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!dragRef.current) return
    dragRef.current.hasMoved = true
    setViewport((prev) => ({
      ...prev,
      x: e.clientX - dragRef.current!.startX,
      y: e.clientY - dragRef.current!.startY,
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
    const next = ZOOM_LEVELS.find((l) => l > viewport.scale + 0.01)
    if (next) zoomTo(next)
  }

  function zoomOut() {
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
        }}
        className="absolute inset-0"
      >
        {/* Connecting lines */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full">
          <line
            x1="50%"
            y1="50%"
            x2="24%"
            y2="36%"
            stroke="rgba(255,255,255,0.06)"
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
            stroke="rgba(255,255,255,0.06)"
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
            x2="76%"
            y2="32%"
            stroke="rgba(255,255,255,0.06)"
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
            x2="30%"
            y2="65%"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
            strokeDasharray="3 6"
            className={cn(
              "transition-opacity duration-700",
              showMrkoll ? "opacity-100" : "opacity-0"
            )}
          />
          <line
            x1="50%"
            y1="50%"
            x2="50%"
            y2="18%"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
            strokeDasharray="3 6"
            className={cn(
              "transition-opacity duration-700",
              showBreach ? "opacity-100" : "opacity-0"
            )}
          />
          {showCompanyNode && (
            <line
              x1="30%"
              y1="65%"
              x2="52%"
              y2="82%"
              stroke="rgba(255,255,255,0.06)"
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
          <div className="h-1.5 w-1.5 rounded-full bg-white opacity-15" />
        </div>

        {/* LinkedIn node */}
        <div className="absolute top-[36%] left-[24%] -translate-x-1/2 -translate-y-1/2">
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

        {/* Mrkoll node */}
        <div className="absolute top-[65%] left-[30%] -translate-x-1/2 -translate-y-1/2">
          <div
            className={cn(
              "transition-all duration-500 ease-out",
              showMrkoll
                ? "translate-y-0 opacity-100"
                : "pointer-events-none translate-y-3 opacity-0"
            )}
          >
            <MrkollNode
              onSelect={() => onSelect("mrkoll")}
              profile={mrkollProfile}
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

        {/* Company node (appears after mrkoll finds companies) */}
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
        className="absolute bottom-5 left-5 flex items-center gap-2"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          onClick={zoomOut}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-700 bg-neutral-900 text-lg leading-none text-neutral-200 transition-colors hover:bg-neutral-800 hover:text-white"
          aria-label="Zoom out"
        >
          −
        </button>
        <span className="w-12 text-center font-mono text-xs text-neutral-400 tabular-nums select-none">
          {Math.round(viewport.scale * 100)}%
        </span>
        <button
          onClick={zoomIn}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-700 bg-neutral-900 text-lg leading-none text-neutral-200 transition-colors hover:bg-neutral-800 hover:text-white"
          aria-label="Zoom in"
        >
          +
        </button>
      </div>
    </div>
  )
}
