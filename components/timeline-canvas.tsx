"use client"

import type { LinkedInProfile } from "@/lib/linkedin"
import type { StravaProfile } from "@/lib/strava"
import type { TimelineEvent, TimelineCluster } from "@/lib/timeline-types"
import type { UserTwitterProfile } from "@/lib/user-record"
import { cn } from "@/lib/utils"
import { useEffect, useMemo, useRef, useState, useCallback } from "react"

// ── Constants ─────────────────────────────────────────────────────────────────
const BASE_PX_PER_DAY = 0.75
const MIN_CANVAS_WIDTH = 1600
const LINE_Y = 260
const GAP_THRESHOLD_DAYS = 90
const GAP_DISPLAY_PX = 80
const MIN_ZOOM = 1
const MAX_ZOOM = 300

// ── Types ─────────────────────────────────────────────────────────────────────
type ActiveSegment = { type: "active"; startMs: number; endMs: number; startX: number }
type GapSegment    = { type: "gap";    startMs: number; endMs: number; startX: number; displayWidth: number }
type Segment = ActiveSegment | GapSegment

// ── Date parsing ──────────────────────────────────────────────────────────────
function parseDate(raw: string | number | null | undefined): Date | null {
  if (raw == null) return null
  if (typeof raw === "number") {
    const d = new Date(raw < 1e10 ? raw * 1000 : raw)
    return isNaN(d.getTime()) ? null : d
  }
  const s = String(raw).trim()
  if (!s) return null
  if (/^\d{4}$/.test(s)) return new Date(`${s}-06-01`)
  if (/^\d{9,13}$/.test(s)) {
    const n = Number(s)
    const d = new Date(n < 1e10 ? n * 1000 : n)
    return isNaN(d.getTime()) ? null : d
  }
  const d = new Date(s.replace(/([+-])(\d{2})(\d{2})$/, "$1$2:$3"))
  return isNaN(d.getTime()) ? null : d
}

const parseLinkedInDate = (raw: string | null): Date | null => parseDate(raw)

// ── Segment-based coordinate system ──────────────────────────────────────────
function buildSegments(
  events: TimelineEvent[],
  today: Date,
  zoom: number
): { segments: Segment[]; canvasWidth: number } {
  const pxPerDay = BASE_PX_PER_DAY * zoom
  const sevenDays = 7 * 86_400_000
  const thresholdMs = GAP_THRESHOLD_DAYS * 86_400_000

  if (events.length === 0) {
    const startMs = today.getTime() - 365 * 10 * 86_400_000
    const endMs = today.getTime() + sevenDays
    const seg: ActiveSegment = { type: "active", startMs, endMs, startX: 60 }
    const w = Math.round(60 + ((endMs - startMs) / 86_400_000) * pxPerDay + 80)
    return { segments: [seg], canvasWidth: Math.max(MIN_CANVAS_WIDTH, w) }
  }

  const raw: { startMs: number; endMs: number }[] = []
  for (const ev of events) {
    const s = ev.startDate.getTime()
    const e = (ev.endDate ?? ev.startDate).getTime()
    raw.push({ startMs: s - sevenDays, endMs: e + sevenDays })
  }
  raw.push({ startMs: today.getTime() - sevenDays, endMs: today.getTime() + sevenDays })

  raw.sort((a, b) => a.startMs - b.startMs)
  const merged: { startMs: number; endMs: number }[] = []
  for (const w of raw) {
    const last = merged[merged.length - 1]
    if (!last || w.startMs > last.endMs + thresholdMs) {
      merged.push({ ...w })
    } else {
      last.endMs = Math.max(last.endMs, w.endMs)
    }
  }

  const segments: Segment[] = []
  let x = 60

  for (let i = 0; i < merged.length; i++) {
    const win = merged[i]

    if (i > 0) {
      const prevEnd = merged[i - 1].endMs
      const gapMs = win.startMs - prevEnd
      if (gapMs > thresholdMs) {
        segments.push({ type: "gap", startMs: prevEnd, endMs: win.startMs, startX: x, displayWidth: GAP_DISPLAY_PX })
        x += GAP_DISPLAY_PX
      } else {
        x += Math.round((gapMs / 86_400_000) * pxPerDay)
      }
    }

    const activeDays = (win.endMs - win.startMs) / 86_400_000
    segments.push({ type: "active", startMs: win.startMs, endMs: win.endMs, startX: x })
    x += Math.round(activeDays * pxPerDay)
  }

  return { segments, canvasWidth: Math.max(MIN_CANVAS_WIDTH, x + 80) }
}

function dateToX(date: Date, segments: Segment[], zoom: number): number {
  const ms = date.getTime()
  const pxPerDay = BASE_PX_PER_DAY * zoom

  for (const seg of segments) {
    if (ms >= seg.startMs && ms <= seg.endMs) {
      if (seg.type === "active") {
        return Math.round(seg.startX + ((ms - seg.startMs) / 86_400_000) * pxPerDay)
      }
      return Math.round(seg.startX + seg.displayWidth / 2)
    }
  }

  const first = segments[0]
  if (ms < first.startMs) {
    return Math.round(first.startX - ((first.startMs - ms) / 86_400_000) * pxPerDay)
  }

  const last = segments[segments.length - 1]
  if (last.type === "active") {
    return Math.round(last.startX + ((ms - last.startMs) / 86_400_000) * pxPerDay)
  }
  return last.startX + last.displayWidth
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function sportIcon(type: string): string {
  switch (type) {
    case "Run": return "↳"
    case "Bike": case "EBike": return "⟳"
    case "Swim": return "∿"
    case "Hike": case "Walk": return "↑"
    case "Ski": return "✦"
    default: return "◆"
  }
}

function fmtDist(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(1)}km` : `${Math.round(m)}m`
}

function fmtTime(s: number): string {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return h > 0 ? `${h}h${m}m` : `${m}m`
}

function fmtEventDate(ev: TimelineEvent): string {
  const d = ev.startDate
  if (ev.kind === "linkedin-experience" || ev.kind === "linkedin-education") {
    return d.toLocaleDateString("en", { month: "short", year: "numeric" })
  }
  return d.toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })
}

function fmtGap(startMs: number, endMs: number): string {
  const days = Math.round((endMs - startMs) / 86_400_000)
  const years = Math.floor(days / 365)
  const months = Math.floor((days % 365) / 30)
  if (years > 0 && months > 0) return `${years}y ${months}m`
  if (years > 0) return `${years}y`
  if (months > 0) return `${months}m`
  return `${days}d`
}

// ── Clustering ────────────────────────────────────────────────────────────────
const CLUSTER_THRESHOLD_PX = 140

function clusterByProximity(
  events: TimelineEvent[],
  toX: (d: Date) => number,
): TimelineCluster[] {
  if (events.length === 0) return []
  const sorted = [...events].sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
  const clusters: TimelineCluster[] = []
  let current: TimelineEvent[] = [sorted[0]]
  let maxX = toX(sorted[0].startDate)

  for (let i = 1; i < sorted.length; i++) {
    const x = toX(sorted[i].startDate)
    if (x - maxX <= CLUSTER_THRESHOLD_PX) {
      current.push(sorted[i])
      maxX = Math.max(maxX, x)
    } else {
      const startX = toX(current[0].startDate)
      const endX = toX(current[current.length - 1].startDate)
      clusters.push({
        id: "cluster-" + current.map(e => e.id).join("-"),
        events: current,
        spanStartX: startX,
        spanEndX: endX,
        centerX: Math.round((startX + endX) / 2),
      })
      current = [sorted[i]]
      maxX = x
    }
  }
  const startX = toX(current[0].startDate)
  const endX = toX(current[current.length - 1].startDate)
  clusters.push({
    id: "cluster-" + current.map(e => e.id).join("-"),
    events: current,
    spanStartX: startX,
    spanEndX: endX,
    centerX: Math.round((startX + endX) / 2),
  })
  return clusters
}

// ── Component ─────────────────────────────────────────────────────────────────
interface TimelineCanvasProps {
  readonly linkedinProfile: LinkedInProfile | null
  readonly stravaProfile: StravaProfile | null
  readonly twitterProfile: UserTwitterProfile | null
  readonly onEventSelect: (event: TimelineEvent) => void
  readonly onClusterSelect: (cluster: TimelineCluster) => void
  readonly highlightedEventId: string | null
}

export function TimelineCanvas({
  linkedinProfile,
  stravaProfile,
  twitterProfile,
  onEventSelect,
  onClusterSelect,
  highlightedEventId,
}: TimelineCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const today = useMemo(() => new Date(), [])

  // ── Zoom + Pan state ───────────────────────────────────────────────────────
  const [zoom, setZoom] = useState(1)
  const [panX, setPanX] = useState(0)
  const [dragging, setDragging] = useState(false)

  const isDraggingRef = useRef(false)
  const dragStartX = useRef(0)
  const dragStartPanX = useRef(0)
  const zoomAnchorRef = useRef<{ readonly screenX: number; readonly ratio: number } | null>(null)

  // Refs for current values needed in non-React event handlers
  const panXRef = useRef(panX)
  panXRef.current = panX

  // ── Build events ────────────────────────────────────────────────────────────
  const events = useMemo<TimelineEvent[]>(() => {
    const result: TimelineEvent[] = []

    if (linkedinProfile) {
      linkedinProfile.experiences.forEach((exp, i) => {
        const startDate = parseLinkedInDate(exp.fromDate)
        if (!startDate) return
        result.push({
          kind: "linkedin-experience",
          id: `exp-${i}`,
          startDate,
          endDate: parseLinkedInDate(exp.toDate),
          label: exp.positionTitle ?? exp.companyName ?? "Role",
          sublabel: exp.companyName ?? null,
          payload: exp,
        })
      })
      linkedinProfile.educations.forEach((edu, i) => {
        const startDate = parseLinkedInDate(edu.fromDate)
        if (!startDate) return
        result.push({
          kind: "linkedin-education",
          id: `edu-${i}`,
          startDate,
          endDate: parseLinkedInDate(edu.toDate),
          label: edu.institutionName ?? "Education",
          sublabel: edu.degree ?? null,
          payload: edu,
        })
      })
      linkedinProfile.posts.forEach((post, i) => {
        const startDate = parseLinkedInDate(post.date)
        if (!startDate) return
        result.push({
          kind: "linkedin-post",
          id: `post-${i}`,
          startDate,
          endDate: null,
          label: post.text?.slice(0, 50) ?? "Post",
          sublabel: null,
          payload: post,
        })
      })
    }

    if (stravaProfile) {
      stravaProfile.activities.forEach((act) => {
        const startDate = parseDate(act.datetime as unknown as string | number)
        if (!startDate) return
        result.push({
          kind: "strava-activity",
          id: `strava-${act.id}`,
          startDate,
          endDate: null,
          label: act.title,
          sublabel: act.sportType,
          payload: act,
        })
      })
    }

    if (twitterProfile) {
      twitterProfile.recent_tweets.forEach((tweet) => {
        const startDate = parseDate(tweet.posted_at)
        if (!startDate) return
        result.push({
          kind: "twitter-tweet",
          id: `tweet-${tweet.id}`,
          startDate,
          endDate: null,
          label: tweet.text.slice(0, 50),
          sublabel: null,
          payload: tweet,
        })
      })
    }

    return result
  }, [linkedinProfile, stravaProfile, twitterProfile])

  // ── Build segment map ───────────────────────────────────────────────────────
  const { segments, canvasWidth } = useMemo(
    () => buildSegments(events, today, zoom),
    [events, today, zoom]
  )

  const canvasWidthRef = useRef(canvasWidth)
  canvasWidthRef.current = canvasWidth

  const toX = (date: Date): number => dateToX(date, segments, zoom)

  // ── Initial pan: position "today" near right side of viewport ─────────────
  const initialPanDone = useRef(false)
  useEffect(() => {
    if (!initialPanDone.current && containerRef.current && events.length > 0) {
      const containerWidth = containerRef.current.clientWidth
      const todayX = dateToX(today, segments, zoom)
      setPanX(containerWidth * 0.75 - todayX)
      initialPanDone.current = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasWidth])

  // ── Zoom anchor: after zoom, adjust pan to keep cursor point stable ───────
  useEffect(() => {
    if (zoomAnchorRef.current) {
      const { screenX, ratio } = zoomAnchorRef.current
      setPanX(screenX - ratio * canvasWidth)
      zoomAnchorRef.current = null
    }
  }, [canvasWidth])

  // ── Wheel handler (passive: false required for preventDefault) ────────────
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const handler = (e: WheelEvent): void => {
      e.preventDefault()

      if (e.ctrlKey || e.metaKey) {
        const rect = el.getBoundingClientRect()
        const screenX = e.clientX - rect.left
        const canvasX = screenX - panXRef.current
        const ratio = canvasX / canvasWidthRef.current

        zoomAnchorRef.current = { screenX, ratio }

        const factor = 1 - e.deltaY * 0.005
        setZoom(z => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z * factor)))
      } else {
        setPanX(x => x - (e.deltaX || e.deltaY))
      }
    }

    el.addEventListener("wheel", handler, { passive: false })
    return () => el.removeEventListener("wheel", handler)
  }, [])

  // ── Drag handlers ─────────────────────────────────────────────────────────
  function handleMouseDown(e: React.MouseEvent): void {
    if (e.button !== 0) return
    isDraggingRef.current = true
    setDragging(true)
    dragStartX.current = e.clientX
    dragStartPanX.current = panXRef.current
  }

  function handleMouseMove(e: React.MouseEvent): void {
    if (!isDraggingRef.current) return
    const dx = e.clientX - dragStartX.current
    setPanX(dragStartPanX.current + dx)
  }

  function handleMouseUp(): void {
    if (isDraggingRef.current) {
      isDraggingRef.current = false
      setDragging(false)
    }
  }

  // ── Zoom buttons (anchor at viewport center) ──────────────────────────────
  const handleZoomIn = useCallback((): void => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const centerX = rect.width / 2
      const canvasX = centerX - panXRef.current
      const ratio = canvasX / canvasWidthRef.current
      zoomAnchorRef.current = { screenX: centerX, ratio }
    }
    setZoom(z => Math.min(MAX_ZOOM, z * 1.5))
  }, [])

  const handleZoomOut = useCallback((): void => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const centerX = rect.width / 2
      const canvasX = centerX - panXRef.current
      const ratio = canvasX / canvasWidthRef.current
      zoomAnchorRef.current = { screenX: centerX, ratio }
    }
    setZoom(z => Math.max(MIN_ZOOM, z / 1.5))
  }, [])

  // ── Ticks (only within active segments) ────────────────────────────────────
  const ticks = useMemo(() => {
    const result: { x: number; label: string; major: boolean }[] = []
    for (const seg of segments) {
      if (seg.type !== "active") continue
      const cursor = new Date(seg.startMs)
      cursor.setDate(1)
      cursor.setHours(0, 0, 0, 0)
      while (cursor.getTime() <= seg.endMs) {
        const ms = cursor.getTime()
        if (ms >= seg.startMs) {
          const x = dateToX(cursor, segments, zoom)
          const isJan = cursor.getMonth() === 0
          result.push({
            x,
            label: isJan
              ? String(cursor.getFullYear())
              : cursor.toLocaleString("en", { month: "short" }),
            major: isJan,
          })
        }
        cursor.setMonth(cursor.getMonth() + 1)
      }
    }
    return result
  }, [segments, zoom])

  const weekTicks = useMemo(() => {
    if (zoom < 4) return []
    const result: { x: number }[] = []
    for (const seg of segments) {
      if (seg.type !== "active") continue
      const cursor = new Date(seg.startMs)
      cursor.setDate(cursor.getDate() - cursor.getDay() + 1)
      cursor.setHours(0, 0, 0, 0)
      while (cursor.getTime() <= seg.endMs) {
        if (cursor.getTime() >= seg.startMs) {
          result.push({ x: dateToX(cursor, segments, zoom) })
        }
        cursor.setDate(cursor.getDate() + 7)
      }
    }
    return result
  }, [segments, zoom])

  // ── Split events by lane ────────────────────────────────────────────────────
  const spans = useMemo(
    () => events.filter(
      (e): e is Extract<TimelineEvent, { kind: "linkedin-experience" | "linkedin-education" }> =>
        e.kind === "linkedin-experience" || e.kind === "linkedin-education"
    ),
    [events]
  )

  const postsAbove = useMemo(
    () => events.filter((e): e is Extract<TimelineEvent, { kind: "linkedin-post" }> => e.kind === "linkedin-post"),
    [events]
  )

  const belowEvents = useMemo(
    () => events
      .filter((e): e is Extract<TimelineEvent, { kind: "strava-activity" | "twitter-tweet" }> =>
        e.kind === "strava-activity" || e.kind === "twitter-tweet"
      )
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime()),
    [events]
  )

  const belowClusters = useMemo(
    () => clusterByProximity(belowEvents, toX),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [belowEvents, segments, zoom]
  )

  const aboveClusters = useMemo(
    () => clusterByProximity(postsAbove, toX),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [postsAbove, segments, zoom]
  )

  const hasData = events.length > 0
  const gapSegments = segments.filter((s): s is GapSegment => s.type === "gap")

  return (
    <div
      ref={containerRef}
      className="relative h-full overflow-hidden select-none bg-white dark:bg-[#080808]"
      style={{ perspective: "1200px", perspectiveOrigin: "center 50%" }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* ── Zoom controls (sticky) ── */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1 rounded-lg border border-neutral-200 bg-white/90 dark:border-neutral-800 dark:bg-[#080808]/90 backdrop-blur-sm p-1">
        <button
          type="button"
          onClick={handleZoomOut}
          disabled={zoom <= MIN_ZOOM}
          className="flex h-6 w-6 items-center justify-center rounded font-mono text-sm text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-500 dark:hover:bg-neutral-900 dark:hover:text-neutral-200 disabled:opacity-30"
        >
          −
        </button>
        <span className="w-8 text-center font-mono text-[8px] tracking-widest text-neutral-400 dark:text-neutral-600">
          {Math.round(zoom)}×
        </span>
        <button
          type="button"
          onClick={handleZoomIn}
          disabled={zoom >= MAX_ZOOM}
          className="flex h-6 w-6 items-center justify-center rounded font-mono text-sm text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-500 dark:hover:bg-neutral-900 dark:hover:text-neutral-200 disabled:opacity-30"
        >
          +
        </button>
      </div>

      {/* ── 3D canvas ── */}
      {!hasData ? (
        <div className="flex h-full items-center justify-center">
          <p className="font-mono text-[10px] tracking-[0.25em] text-neutral-400 dark:text-neutral-700">
            LOAD PROFILES IN GRAPH VIEW TO SEE TIMELINE
          </p>
        </div>
      ) : (
        <div
          className="absolute top-0 left-0"
          style={{
            width: canvasWidth,
            height: "100%",
            transform: `translateX(${panX}px) rotateX(2deg)`,
            transformOrigin: `center ${LINE_Y}px`,
            transformStyle: "preserve-3d",
            cursor: dragging ? "grabbing" : "grab",
          }}
        >

          {/* ── Gap background strips ── */}
          {gapSegments.map((seg, i) => (
            <div
              key={`gap-bg-${i}`}
              className="absolute top-0 h-full"
              style={{
                left: seg.startX,
                width: seg.displayWidth,
                background: "repeating-linear-gradient(45deg, #0f0f0f 0px, #0f0f0f 4px, #080808 4px, #080808 8px)",
              }}
            />
          ))}

          {/* ── Tick marks ── */}
          {weekTicks.map((tick, i) => (
            <div
              key={`week-${i}`}
              className="absolute w-px bg-neutral-800/70"
              style={{ left: tick.x, top: LINE_Y - 3, height: 6 }}
            />
          ))}
          {ticks.map((tick) => (
            <div
              key={tick.label + tick.x}
              className="absolute"
              style={{ left: tick.x, top: LINE_Y - (tick.major ? 14 : 7) }}
            >
              <div className={cn("w-px", tick.major ? "h-7 bg-neutral-400" : "h-4 bg-neutral-600")} />
              <span
                className={cn(
                  "absolute whitespace-nowrap font-mono -translate-x-1/2",
                  tick.major
                    ? "text-sm tracking-widest text-neutral-300 mt-1"
                    : "text-[10px] tracking-wider text-neutral-600 mt-0.5"
                )}
                style={{ top: tick.major ? 28 : 16 }}
              >
                {tick.label}
              </span>
            </div>
          ))}

          {/* ── Today marker ── */}
          <div
            className="absolute w-px bg-neutral-500/50"
            style={{ left: toX(today), top: LINE_Y - 40, height: 80 }}
          />
          <span
            className="absolute font-mono text-[10px] tracking-widest text-neutral-500"
            style={{ left: toX(today) + 4, top: LINE_Y - 38 }}
          >
            TODAY
          </span>

          {/* ── The timeline line ── */}
          <div
            className="absolute bg-neutral-700"
            style={{ top: LINE_Y, left: 0, width: canvasWidth, height: 1 }}
          />

          {/* ── Gap markers on the line ── */}
          {gapSegments.map((seg, i) => (
            <div key={`gap-${i}`}>
              <div className="absolute w-px bg-neutral-500" style={{ left: seg.startX, top: LINE_Y - 16, height: 32 }} />
              <div className="absolute w-px bg-neutral-500" style={{ left: seg.startX + seg.displayWidth, top: LINE_Y - 16, height: 32 }} />
              <div
                className="absolute border-t-2 border-dashed border-neutral-600"
                style={{ left: seg.startX, top: LINE_Y, width: seg.displayWidth }}
              />
              <div
                className="absolute flex flex-col items-center -translate-x-1/2"
                style={{ left: seg.startX + seg.displayWidth / 2, top: LINE_Y - 22 }}
              >
                <span className="font-mono text-[11px] tracking-widest text-neutral-400">
                  {fmtGap(seg.startMs, seg.endMs)}
                </span>
              </div>
              <span
                className="absolute font-mono text-[9px] tracking-widest text-neutral-600 -translate-x-1/2"
                style={{ left: seg.startX + seg.displayWidth / 2, top: LINE_Y + 8 }}
              >
                skipped
              </span>
            </div>
          ))}

          {/* ── LinkedIn experience/education spans (above line) ── */}
          {spans.map((ev) => {
            const x = toX(ev.startDate)
            const endX = toX(ev.endDate ?? today)
            const w = Math.max(endX - x, 12)
            const isEdu = ev.kind === "linkedin-education"
            return (
              <button
                key={ev.id}
                type="button"
                onClick={() => onEventSelect(ev)}
                title={ev.sublabel ? `${ev.label} @ ${ev.sublabel}` : ev.label}
                className={cn(
                  "absolute flex items-center rounded transition-opacity hover:opacity-80 focus:outline-none",
                  isEdu
                    ? "border border-sky-800/60 bg-sky-950/70"
                    : "border border-blue-800/60 bg-blue-950/70"
                )}
                style={{ left: x, top: LINE_Y - 58, width: w, height: 36 }}
              >
                {w > 50 && (
                  <span className="truncate px-2.5 font-mono text-xs text-blue-300/90">
                    {ev.label}
                  </span>
                )}
              </button>
            )
          })}

          {/* Connector lines from spans to the line + date label */}
          {spans.map((ev) => {
            const x = toX(ev.startDate)
            return (
              <div key={`conn-${ev.id}`} className="absolute" style={{ left: x, top: LINE_Y - 22 }}>
                <div className="w-px bg-neutral-700/50" style={{ height: 22 }} />
                <span
                  className="absolute bottom-full left-1 mb-1 whitespace-nowrap font-mono text-[9px] text-neutral-400"
                >
                  {fmtEventDate(ev)}
                </span>
              </div>
            )
          })}

          {/* ── LinkedIn posts (pills above line + connector + date) ── */}
          {aboveClusters.map((cluster) => {
            if (cluster.events.length === 1) {
              const ev = cluster.events[0]
              const x = toX(ev.startDate)
              const pillTop = LINE_Y - 100
              const connectorHeight = LINE_Y - pillTop - 18
              const isHighlighted = ev.id === highlightedEventId
              return (
                <div key={cluster.id} className="absolute" style={{ left: x, top: pillTop }}>
                  <button
                    type="button"
                    onClick={() => onEventSelect(ev)}
                    title={ev.label}
                    className={cn(
                      "flex items-center gap-1 rounded-full border px-2 py-0.5 transition-all hover:opacity-80 focus:outline-none",
                      isHighlighted
                        ? "border-blue-500/80 bg-blue-900/60 ring-2 ring-blue-500/40"
                        : "border-blue-700/40 bg-blue-900/40"
                    )}
                  >
                    <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                    <span className="max-w-[140px] truncate font-mono text-[10px] text-blue-400/90">
                      {ev.label}
                    </span>
                  </button>
                  <div className="absolute w-px bg-neutral-700/40" style={{ left: 8, top: 18, height: connectorHeight }} />
                  <span className="absolute bottom-full left-1 mb-1 whitespace-nowrap font-mono text-[9px] text-neutral-400">
                    {fmtEventDate(ev)}
                  </span>
                </div>
              )
            }

            const isHighlighted = cluster.events.some(e => e.id === highlightedEventId)
            const bracketY = LINE_Y - 90
            const connectorHeight = LINE_Y - bracketY
            const spanW = Math.max(cluster.spanEndX - cluster.spanStartX, 0)
            return (
              <div key={cluster.id} className="absolute" style={{ left: cluster.spanStartX, top: bracketY }}>
                <div
                  className="absolute bg-blue-700/40"
                  style={{ left: 0, top: 0, width: spanW + 1, height: 1 }}
                />
                <div className="absolute bg-blue-700/40" style={{ left: 0, top: -4, width: 1, height: 8 }} />
                <div className="absolute bg-blue-700/40" style={{ left: spanW, top: -4, width: 1, height: 8 }} />
                <div
                  className="absolute w-px bg-neutral-700/40"
                  style={{ left: cluster.centerX - cluster.spanStartX, top: 0, height: connectorHeight }}
                />
                <button
                  type="button"
                  onClick={() => onClusterSelect(cluster)}
                  className={cn(
                    "absolute flex items-center gap-1 rounded-full border px-2 py-0.5 transition-all hover:opacity-80 focus:outline-none -translate-x-1/2",
                    isHighlighted
                      ? "border-blue-500/80 bg-blue-900/60 ring-2 ring-blue-500/40"
                      : "border-blue-700/40 bg-blue-900/40"
                  )}
                  style={{ left: cluster.centerX - cluster.spanStartX, top: -18 }}
                >
                  <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                  <span className="font-mono text-[10px] text-blue-400/90">{cluster.events.length} posts</span>
                </button>
              </div>
            )
          })}

          {/* ── Below-line events: Strava + Twitter ── */}
          {belowClusters.map((cluster) => {
            if (cluster.events.length === 1) {
              const ev = cluster.events[0]
              const x = toX(ev.startDate)
              const isStrava = ev.kind === "strava-activity"
              const isHighlighted = ev.id === highlightedEventId
              return (
                <div key={cluster.id} className="absolute z-10" style={{ left: x, top: LINE_Y }}>
                  <div
                    className={cn("w-px", isStrava ? "bg-orange-800/50" : "bg-neutral-700/50")}
                    style={{ height: 18 }}
                  />
                  <span
                    className={cn(
                      "absolute bottom-full left-1 mb-1 whitespace-nowrap font-mono text-[9px]",
                      isStrava ? "text-orange-600" : "text-neutral-500"
                    )}
                  >
                    {fmtEventDate(ev)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onEventSelect(ev)}
                    className={cn(
                      "absolute flex flex-col rounded-lg border px-2.5 py-2 text-left transition-all hover:opacity-80 focus:outline-none",
                      isStrava
                        ? "border-orange-800/50 bg-orange-950/60"
                        : "border-neutral-700/50 bg-neutral-900/60",
                      isHighlighted && "ring-2 ring-blue-500/60"
                    )}
                    style={{ top: 18, left: -8, width: 140 }}
                  >
                    {isStrava && ev.kind === "strava-activity" ? (
                      <>
                        <div className="mb-1 flex items-center gap-1.5">
                          <span className="text-xs text-orange-500">{sportIcon(ev.payload.sportType)}</span>
                          <span className="font-mono text-[10px] tracking-widest text-orange-600 uppercase">{ev.payload.sportType}</span>
                        </div>
                        <span className="truncate font-mono text-xs text-orange-200">{ev.label}</span>
                        {(ev.payload.distanceMeters != null || ev.payload.movingTimeSeconds != null) && (
                          <span className="mt-1 font-mono text-[10px] text-orange-600">
                            {ev.payload.distanceMeters != null ? fmtDist(ev.payload.distanceMeters) : ""}
                            {ev.payload.distanceMeters != null && ev.payload.movingTimeSeconds != null ? " · " : ""}
                            {ev.payload.movingTimeSeconds != null ? fmtTime(ev.payload.movingTimeSeconds) : ""}
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="mb-1 flex items-center gap-1.5">
                          <span className="font-mono text-[10px] tracking-widest text-neutral-600">X</span>
                        </div>
                        <span className="line-clamp-2 font-mono text-xs text-neutral-300">{ev.label}</span>
                      </>
                    )}
                  </button>
                </div>
              )
            }

            const isHighlighted = cluster.events.some(e => e.id === highlightedEventId)
            const hasStrava = cluster.events.some(e => e.kind === "strava-activity")
            const hasTwitter = cluster.events.some(e => e.kind === "twitter-tweet")
            const spanW = Math.max(cluster.spanEndX - cluster.spanStartX, 0)
            const badgeOffsetX = cluster.centerX - cluster.spanStartX
            return (
              <div key={cluster.id} className="absolute z-0" style={{ left: cluster.spanStartX, top: LINE_Y }}>
                <div
                  className="absolute w-px bg-neutral-700/40"
                  style={{ left: badgeOffsetX, top: 0, height: 18 }}
                />
                {spanW > 10 && (
                  <>
                    <div className="absolute bg-neutral-700/40" style={{ left: 0, top: 18, width: spanW + 1, height: 1 }} />
                    <div className="absolute bg-neutral-700/40" style={{ left: 0, top: 15, width: 1, height: 7 }} />
                    <div className="absolute bg-neutral-700/40" style={{ left: spanW, top: 15, width: 1, height: 7 }} />
                  </>
                )}
                <button
                  type="button"
                  onClick={() => onClusterSelect(cluster)}
                  className={cn(
                    "absolute flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 transition-all hover:opacity-80 focus:outline-none -translate-x-1/2",
                    isHighlighted
                      ? "border-neutral-600 bg-neutral-800 ring-2 ring-blue-500/60"
                      : "border-neutral-700/60 bg-neutral-900/70"
                  )}
                  style={{ left: badgeOffsetX, top: spanW > 10 ? 24 : 18 }}
                >
                  {hasStrava && <span className="font-mono text-[10px] text-orange-500">◆</span>}
                  {hasTwitter && <span className="font-mono text-[10px] text-neutral-500">X</span>}
                  <span className="font-mono text-[10px] text-neutral-300">{cluster.events.length}</span>
                </button>
              </div>
            )
          })}

          {/* ── Legend ── */}
          <div className="absolute flex items-center gap-5" style={{ bottom: 20, left: Math.max(20, -panX + 20) }}>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-5 rounded-sm border border-blue-800/60 bg-blue-900/70" />
              <span className="font-mono text-[8px] tracking-widest text-neutral-600">LINKEDIN</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded border border-orange-800/50 bg-orange-950/70" />
              <span className="font-mono text-[8px] tracking-widest text-neutral-600">STRAVA</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded border border-neutral-700/50 bg-neutral-900/70" />
              <span className="font-mono text-[8px] tracking-widest text-neutral-600">X / TWITTER</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-sm" style={{ background: "repeating-linear-gradient(45deg, #1a1a1a 0px, #1a1a1a 2px, #080808 2px, #080808 4px)" }} />
              <span className="font-mono text-[8px] tracking-widest text-neutral-600">EMPTY PERIOD</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
