"use client"

import { useState, useCallback, type ElementType } from "react"
import { Search, ArrowRight, MapPin, Mail, Phone, Globe, ChevronDown, ChevronUp } from "lucide-react"
import { GraphCanvas } from "@/components/graph-canvas"
import { DetailPanel } from "@/components/detail-panel"
import { cn } from "@/lib/utils"
import type { LinkedInProfile, LinkedInSearchResult } from "@/lib/linkedin"
import personData from "@/data/mock/person.json"

function ContactRow({ icon: Icon, text }: { icon: ElementType; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3 w-3 shrink-0 text-neutral-700" />
      <span className="truncate text-[11px] text-neutral-500">{text}</span>
    </div>
  )
}

interface PersonNodeProps {
  name: string
  expanded: boolean
  onToggle: () => void
}

function PersonNode({ name, expanded, onToggle }: PersonNodeProps) {
  return (
    <div
      onClick={onToggle}
      className="cursor-pointer rounded-xl border border-neutral-800 bg-[#0b0b0b] p-4 transition-colors hover:border-neutral-700"
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[9px] tracking-[0.2em] text-neutral-600">SUBJECT</span>
        {expanded
          ? <ChevronUp className="h-3 w-3 text-neutral-700" />
          : <ChevronDown className="h-3 w-3 text-neutral-700" />
        }
      </div>

      <p className="text-sm font-light text-foreground">{name}</p>

      <div className={cn(
        "grid transition-all duration-300",
        expanded ? "mt-3 grid-rows-[1fr]" : "grid-rows-[0fr]"
      )}>
        <div className="overflow-hidden">
          <div className="space-y-2 border-t border-neutral-800 pt-3">
            <ContactRow icon={MapPin} text={`${personData.city}, ${personData.state}`} />
            <ContactRow icon={Mail} text={personData.email} />
            <ContactRow icon={Phone} text={personData.phone} />
            <ContactRow icon={Globe} text={personData.website} />
          </div>
        </div>
      </div>
    </div>
  )
}

type LinkedInPanelState =
  | { status: "searching" }
  | { status: "search-results"; results: readonly LinkedInSearchResult[] }
  | { status: "scraping"; name: string }
  | { status: "profile"; profile: LinkedInProfile }
  | { status: "error"; message: string }

export default function Page() {
  const [query, setQuery] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [targetName, setTargetName] = useState("")
  const [selectedNode, setSelectedNode] = useState<"linkedin" | "x" | null>(null)
  const [subjectExpanded, setSubjectExpanded] = useState(false)
  const [linkedinState, setLinkedinState] = useState<LinkedInPanelState | null>(null)

  function handleSearch() {
    const name = query.trim()
    if (!name) return
    setTargetName(name)
    setSubmitted(true)
    setTimeout(() => {
      setShowResults(true)
      setSubjectExpanded(true)
    }, 480)
  }

  const handleLinkedinSelect = useCallback(async () => {
    setSelectedNode("linkedin")
    setLinkedinState({ status: "searching" })

    try {
      const res = await fetch("/api/linkedin/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: targetName }),
      })
      const data = await res.json()

      if (data.ok) {
        setLinkedinState({ status: "search-results", results: data.data })
      } else {
        setLinkedinState({ status: "error", message: data.error })
      }
    } catch {
      setLinkedinState({ status: "error", message: "Failed to search LinkedIn" })
    }
  }, [targetName])

  const handleSelectSearchResult = useCallback(async (result: LinkedInSearchResult) => {
    setLinkedinState({ status: "scraping", name: result.name })

    try {
      const res = await fetch("/api/linkedin/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: result.profileUrl }),
      })
      const data = await res.json()

      if (data.ok) {
        setLinkedinState({ status: "profile", profile: data.data })
      } else {
        setLinkedinState({ status: "error", message: data.error })
      }
    } catch {
      setLinkedinState({ status: "error", message: "Failed to scrape profile" })
    }
  }, [])

  const handleSelectNode = useCallback((source: "linkedin" | "x") => {
    if (source === "linkedin") {
      handleLinkedinSelect()
    } else {
      setSelectedNode(source)
    }
  }, [handleLinkedinSelect])

  const handleClosePanel = useCallback(() => {
    setSelectedNode(null)
    // Keep linkedin state so re-opening shows previous results
  }, [])

  return (
    <div className="relative h-screen overflow-hidden bg-background">
      {/* Dot grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Left sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex w-72 flex-col border-r border-neutral-800 bg-background p-6",
          "transition-transform duration-500 ease-in-out",
          submitted ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="mb-6">
          <span className="font-mono text-xs tracking-[0.3em] text-neutral-500">THEA</span>
          <p className="mt-1.5 text-[10px] uppercase tracking-[0.2em] text-neutral-600">is looking for</p>
        </div>

        {/* Subject nodes + add button */}
        <div className={cn(
          "flex flex-col gap-2 transition-all duration-500",
          showResults ? "opacity-100" : "opacity-0"
        )}>
          <PersonNode
            name={targetName}
            expanded={subjectExpanded}
            onToggle={() => setSubjectExpanded(!subjectExpanded)}
          />
        </div>
      </aside>

      {/* Top bar — landing only */}
      <header
        className={cn(
          "absolute inset-x-0 top-0 z-10 flex items-center px-6 py-5 transition-opacity duration-300",
          submitted ? "pointer-events-none opacity-0" : "opacity-100"
        )}
      >
        <span className="font-mono text-sm tracking-[0.3em] text-foreground">THEA</span>
      </header>

      {/* Main */}
      <main
        style={{
          marginLeft: submitted ? "288px" : "0px",
          marginRight: selectedNode ? "420px" : "0px",
          transition: "margin 500ms cubic-bezier(0.4, 0, 0.2, 1)",
          height: "100%",
        }}
      >
        {/* Landing */}
        {!showResults && (
          <div className={cn(
            "flex min-h-svh flex-col items-center justify-center px-4 pb-24",
            "transition-all duration-500",
            submitted ? "pointer-events-none scale-95 opacity-0" : "scale-100 opacity-100"
          )}>
            <h1 className="mb-8 text-[2rem] font-light tracking-tight text-foreground">
              Who are you looking for?
            </h1>

            <div className="w-full max-w-2xl">
              <div className="flex items-center gap-3 rounded-2xl border border-neutral-800 bg-neutral-900 px-4 py-3.5 transition-colors focus-within:border-neutral-700">
                <Search className="h-4 w-4 shrink-0 text-neutral-600" />
                <input
                  autoFocus
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-neutral-600 focus:outline-none"
                  placeholder="Enter a full name..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <button
                  onClick={handleSearch}
                  disabled={!query.trim()}
                  aria-label="Search"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-black transition-all duration-200 disabled:pointer-events-none disabled:opacity-0"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <p className="mt-4 text-xs text-neutral-700">
              Search across public records, social profiles, and open data
            </p>
          </div>
        )}

        {/* Results */}
        {showResults && (
          <div className="animate-in fade-in h-full duration-500">
            <GraphCanvas
              onSelect={handleSelectNode}
              onDeselect={() => setSelectedNode(null)}
              linkedinProfile={linkedinState?.status === "profile" ? linkedinState.profile : null}
            />
          </div>
        )}
      </main>

      {/* Right detail panel */}
      <DetailPanel
        source={selectedNode}
        onClose={handleClosePanel}
        linkedinState={linkedinState}
        onSelectSearchResult={handleSelectSearchResult}
      />
    </div>
  )
}
