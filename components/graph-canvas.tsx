"use client"

import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import linkedinData from "@/data/mock/linkedin.json"
import xData from "@/data/mock/x.json"

function LinkedinNode({ onSelect }: { onSelect: () => void }) {
  const d = linkedinData.profile

  return (
    <div
      onClick={onSelect}
      onMouseDown={(e) => e.stopPropagation()}
      className="w-60 cursor-pointer rounded-xl border border-neutral-800 bg-[#0b0b0b] p-4 transition-colors hover:border-neutral-600"
    >
      <div className="mb-3">
        <span className="font-mono text-[10px] tracking-[0.2em] text-blue-500">LINKEDIN</span>
      </div>
      <p className="text-base font-light text-foreground">{d.name}</p>
      <p className="mt-1 line-clamp-2 text-xs leading-snug text-neutral-500">{d.headline}</p>
      <div className="mt-3 space-y-1.5">
        <p className="text-xs text-neutral-500">{d.current_position.title} · {d.current_position.company}</p>
        <p className="text-xs text-neutral-600">{d.location}</p>
        <p className="text-xs text-neutral-600">{d.connections} connections</p>
      </div>
    </div>
  )
}

function XNode({ onSelect }: { onSelect: () => void }) {
  const d = xData.profile

  return (
    <div
      onClick={onSelect}
      onMouseDown={(e) => e.stopPropagation()}
      className="w-60 cursor-pointer rounded-xl border border-neutral-800 bg-[#0b0b0b] p-4 transition-colors hover:border-neutral-600"
    >
      <div className="mb-3">
        <span className="font-mono text-[10px] tracking-[0.2em] text-neutral-400">X / TWITTER</span>
      </div>
      <p className="text-base font-light text-foreground">{d.handle}</p>
      <p className="mt-1 line-clamp-2 text-xs leading-snug text-neutral-500">{d.bio}</p>
      <div className="mt-3 space-y-1.5">
        <p className="text-xs text-neutral-500">
          {d.followers.toLocaleString()} followers · {d.following.toLocaleString()} following
        </p>
        <p className="text-xs text-neutral-600">{d.tweets_count.toLocaleString()} tweets</p>
        <p className="text-xs text-neutral-600">{d.location}</p>
      </div>
    </div>
  )
}

interface Viewport {
  scale: number
  x: number
  y: number
}

interface GraphCanvasProps {
  onSelect: (source: "linkedin" | "x") => void
  onDeselect: () => void
}

export function GraphCanvas({ onSelect, onDeselect }: GraphCanvasProps) {
  const [showLinkedin, setShowLinkedin] = useState(false)
  const [showX, setShowX] = useState(false)
  const [viewport, setViewport] = useState<Viewport>({ scale: 1, x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ startX: number; startY: number; hasMoved: boolean } | null>(null)

  useEffect(() => {
    const t1 = setTimeout(() => setShowLinkedin(true), 600)
    const t2 = setTimeout(() => setShowX(true), 2400)
    return () => { clearTimeout(t1); clearTimeout(t2) }
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
    dragRef.current = { startX: e.clientX - viewport.x, startY: e.clientY - viewport.y, hasMoved: false }
    setIsDragging(true)
  }

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!dragRef.current) return
    dragRef.current.hasMoved = true
    setViewport(prev => ({
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
    setViewport(prev => {
      const ratio = newScale / prev.scale
      return {
        scale: newScale,
        x: cx - (cx - prev.x) * ratio,
        y: cy - (cy - prev.y) * ratio,
      }
    })
  }

  function zoomIn() {
    const next = ZOOM_LEVELS.find(l => l > viewport.scale + 0.01)
    if (next) zoomTo(next)
  }

  function zoomOut() {
    const prev = [...ZOOM_LEVELS].reverse().find(l => l < viewport.scale - 0.01)
    if (prev) zoomTo(prev)
  }

  return (
    <div
      ref={canvasRef}
      className={cn(
        "relative h-full w-full select-none overflow-hidden",
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
          transition: isDragging ? "none" : "transform 350ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
        className="absolute inset-0"
      >
        {/* Connecting lines */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full">
          <line
            x1="50%" y1="50%"
            x2="24%" y2="36%"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
            strokeDasharray="3 6"
            className={cn("transition-opacity duration-700", showLinkedin ? "opacity-100" : "opacity-0")}
          />
          <line
            x1="50%" y1="50%"
            x2="67%" y2="63%"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
            strokeDasharray="3 6"
            className={cn("transition-opacity duration-700", showX ? "opacity-100" : "opacity-0")}
          />
        </svg>

        {/* Center dot */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="h-1.5 w-1.5 rounded-full bg-white opacity-15" />
        </div>

        {/* LinkedIn node */}
        <div className="absolute left-[24%] top-[36%] -translate-x-1/2 -translate-y-1/2">
          <div className={cn(
            "transition-all duration-500 ease-out",
            showLinkedin ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
          )}>
            <LinkedinNode onSelect={() => onSelect("linkedin")} />
          </div>
        </div>

        {/* X node */}
        <div className="absolute left-[67%] top-[63%] -translate-x-1/2 -translate-y-1/2">
          <div className={cn(
            "transition-all duration-500 ease-out",
            showX ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
          )}>
            <XNode onSelect={() => onSelect("x")} />
          </div>
        </div>
      </div>

      {/* Zoom controls */}
      <div
        className="absolute bottom-5 left-5 flex items-center gap-2"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          onClick={zoomOut}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-700 bg-neutral-900 text-neutral-200 text-lg leading-none transition-colors hover:bg-neutral-800 hover:text-white"
          aria-label="Zoom out"
        >
          −
        </button>
        <span className="w-12 text-center font-mono text-xs text-neutral-400 select-none tabular-nums">
          {Math.round(viewport.scale * 100)}%
        </span>
        <button
          onClick={zoomIn}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-700 bg-neutral-900 text-neutral-200 text-lg leading-none transition-colors hover:bg-neutral-800 hover:text-white"
          aria-label="Zoom in"
        >
          +
        </button>
      </div>
    </div>
  )
}
