"use client"

import { useState, useCallback, useEffect, type ElementType } from "react"
import { useParams } from "next/navigation"
import { MapPin, Mail, Phone, Globe, ChevronDown, ChevronUp } from "lucide-react"
import { GraphCanvas } from "@/components/graph-canvas"
import { DetailPanel } from "@/components/detail-panel"
import type { LinkedInPanelState, StravaPanelState, MrkollPanelState, KrafmanPanelState } from "@/components/detail-panel"
import { cn } from "@/lib/utils"
import type { LinkedInSearchResult, LinkedInProfile } from "@/lib/linkedin"
import type { StravaSearchResult } from "@/lib/strava"
import type { MrkollSearchResult, MrkollCompanyEngagement } from "@/lib/mrkoll.types"
import personData from "@/data/mock/person.json"

function ContactRow({ icon: Icon, text }: { readonly icon: ElementType; readonly text: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3 w-3 shrink-0 text-neutral-700" />
      <span className="truncate text-[11px] text-neutral-500">{text}</span>
    </div>
  )
}

interface PersonNodeProps {
  readonly name: string
  readonly expanded: boolean
  readonly onToggle: () => void
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

interface UserData {
  readonly id: string
  readonly name: string
  readonly linkedin: LinkedInProfile | null
}

export default function UserPage() {
  const params = useParams<{ userId: string }>()
  const userId = params.userId

  const [targetName, setTargetName] = useState("")
  const [loading, setLoading] = useState(true)
  const [selectedNode, setSelectedNode] = useState<"linkedin" | "x" | "strava" | "mrkoll" | "company" | null>(null)
  const [subjectExpanded, setSubjectExpanded] = useState(true)
  const [linkedinState, setLinkedinState] = useState<LinkedInPanelState | null>(null)
  const [stravaState, setStravaState] = useState<StravaPanelState | null>(null)
  const [mrkollState, setMrkollState] = useState<MrkollPanelState | null>(null)
  const [krafmanState, setKrafmanState] = useState<KrafmanPanelState | null>(null)
  const [activeCompany, setActiveCompany] = useState<MrkollCompanyEngagement | null>(null)

  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then((res) => res.json())
      .then((data: { ok: boolean; data?: UserData }) => {
        if (data.ok && data.data) {
          setTargetName(data.data.name)
          if (data.data.linkedin) {
            setLinkedinState({ status: "profile", profile: data.data.linkedin })
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [userId])

  /* ─── LinkedIn ─── */

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
        setLinkedinState({ status: "search-results", results: data.data, query: targetName })
      } else {
        setLinkedinState({ status: "error", message: data.error })
      }
    } catch {
      setLinkedinState({ status: "error", message: "Failed to search LinkedIn" })
    }
  }, [targetName])

  const handleRetryLinkedInSearch = useCallback(async (searchQuery: string) => {
    setLinkedinState({ status: "searching" })

    try {
      const res = await fetch("/api/linkedin/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: searchQuery }),
      })
      const data = await res.json()

      if (data.ok) {
        setLinkedinState({ status: "search-results", results: data.data, query: searchQuery })
      } else {
        setLinkedinState({ status: "error", message: data.error })
      }
    } catch {
      setLinkedinState({ status: "error", message: "Failed to search LinkedIn" })
    }
  }, [])

  const handleSelectLinkedInResult = useCallback(async (result: LinkedInSearchResult) => {
    setLinkedinState({ status: "scraping", name: result.name })

    try {
      const res = await fetch("/api/linkedin/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: result.profileUrl, searchName: targetName }),
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
  }, [targetName])

  /* ─── Strava ─── */

  const handleStravaSelect = useCallback(async () => {
    setSelectedNode("strava")
    setStravaState({ status: "searching" })

    try {
      const res = await fetch("/api/strava/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: targetName }),
      })
      const data = await res.json()

      if (data.ok) {
        setStravaState({ status: "search-results", results: data.data, query: targetName })
      } else {
        setStravaState({ status: "error", message: data.error })
      }
    } catch {
      setStravaState({ status: "error", message: "Failed to search Strava" })
    }
  }, [targetName])

  const handleSelectStravaResult = useCallback(async (result: StravaSearchResult) => {
    setStravaState({ status: "scraping", name: result.name })

    const athleteId = result.athleteUrl.split("/athletes/")[1]?.replace(/\/$/, "")
    if (!athleteId) {
      setStravaState({ status: "error", message: "Invalid athlete URL" })
      return
    }

    try {
      const res = await fetch("/api/strava/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ athleteId }),
      })
      const data = await res.json()

      if (data.ok) {
        setStravaState({ status: "profile", profile: data.data })
      } else {
        setStravaState({ status: "error", message: data.error })
      }
    } catch {
      setStravaState({ status: "error", message: "Failed to load athlete profile" })
    }
  }, [])

  const handleRetryStravaSearch = useCallback(async (searchQuery: string) => {
    setStravaState({ status: "searching" })

    try {
      const res = await fetch("/api/strava/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: searchQuery }),
      })
      const data = await res.json()

      if (data.ok) {
        setStravaState({ status: "search-results", results: data.data, query: searchQuery })
      } else {
        setStravaState({ status: "error", message: data.error })
      }
    } catch {
      setStravaState({ status: "error", message: "Failed to search Strava" })
    }
  }, [])

  /* ─── Mrkoll ─── */

  const handleMrkollSelect = useCallback(async () => {
    setSelectedNode("mrkoll")
    setMrkollState({ status: "searching" })

    try {
      const res = await fetch("/api/mrkoll/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: targetName }),
      })
      const data = await res.json()

      if (data.ok) {
        setMrkollState({ status: "search-results", results: data.data, query: targetName })
      } else {
        setMrkollState({ status: "error", message: data.error })
      }
    } catch {
      setMrkollState({ status: "error", message: "Failed to search Mrkoll" })
    }
  }, [targetName])

  const handleRetryMrkollSearch = useCallback(async (searchQuery: string) => {
    setMrkollState({ status: "searching" })

    try {
      const res = await fetch("/api/mrkoll/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: searchQuery }),
      })
      const data = await res.json()

      if (data.ok) {
        setMrkollState({ status: "search-results", results: data.data, query: searchQuery })
      } else {
        setMrkollState({ status: "error", message: data.error })
      }
    } catch {
      setMrkollState({ status: "error", message: "Failed to search Mrkoll" })
    }
  }, [])

  const handleSelectMrkollResult = useCallback(async (result: MrkollSearchResult) => {
    setMrkollState({ status: "scraping", name: result.name })

    try {
      const res = await fetch("/api/mrkoll/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: result.profileUrl }),
      })
      const data = await res.json()

      if (data.ok) {
        setMrkollState({ status: "profile", profile: data.data })
        const firstCompanyWithKrafman = data.data.companies?.find(
          (c: MrkollCompanyEngagement) => c.krafmanUrl
        )
        if (firstCompanyWithKrafman) {
          setActiveCompany(firstCompanyWithKrafman)
          loadKrafmanCompany(firstCompanyWithKrafman)
        }
      } else {
        setMrkollState({ status: "error", message: data.error })
      }
    } catch {
      setMrkollState({ status: "error", message: "Failed to load profile" })
    }
  }, [])

  /* ─── Krafman ─── */

  const loadKrafmanCompany = useCallback(async (company: MrkollCompanyEngagement) => {
    if (!company.krafmanUrl) return

    setActiveCompany(company)
    setKrafmanState({ status: "scraping", companyName: company.companyName })

    try {
      const res = await fetch("/api/krafman/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: company.krafmanUrl }),
      })
      const data = await res.json()

      if (data.ok) {
        setKrafmanState({ status: "profile", profile: data.data })
      } else {
        setKrafmanState({ status: "error", message: data.error })
      }
    } catch {
      setKrafmanState({ status: "error", message: "Failed to load company" })
    }
  }, [])

  const handleOpenCompany = useCallback((company: MrkollCompanyEngagement) => {
    if (company.krafmanUrl) {
      loadKrafmanCompany(company)
      setSelectedNode("company")
    }
  }, [loadKrafmanCompany])

  /* ─── Node Selection ─── */

  const handleSelectNode = useCallback((source: "linkedin" | "x" | "strava" | "mrkoll" | "company") => {
    if (source === "linkedin") {
      handleLinkedinSelect()
    } else if (source === "strava") {
      handleStravaSelect()
    } else if (source === "mrkoll") {
      handleMrkollSelect()
    } else {
      setSelectedNode(source)
    }
  }, [handleLinkedinSelect, handleStravaSelect, handleMrkollSelect])

  const handleClosePanel = useCallback(() => {
    setSelectedNode(null)
  }, [])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <span className="font-mono text-xs tracking-[0.3em] text-neutral-500">Loading...</span>
      </div>
    )
  }

  if (!targetName) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <span className="font-mono text-xs tracking-[0.3em] text-neutral-500">User not found</span>
      </div>
    )
  }

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
      <aside className="fixed inset-y-0 left-0 z-30 flex w-72 flex-col border-r border-neutral-800 bg-background p-6">
        <div className="mb-6">
          <span className="font-mono text-xs tracking-[0.3em] text-neutral-500">THEA</span>
          <p className="mt-1.5 text-[10px] uppercase tracking-[0.2em] text-neutral-600">is looking for</p>
        </div>

        <div className="flex flex-col gap-2">
          <PersonNode
            name={targetName}
            expanded={subjectExpanded}
            onToggle={() => setSubjectExpanded(!subjectExpanded)}
          />
        </div>
      </aside>

      {/* Main */}
      <main
        style={{
          marginLeft: "288px",
          marginRight: selectedNode ? "420px" : "0px",
          transition: "margin 500ms cubic-bezier(0.4, 0, 0.2, 1)",
          height: "100%",
        }}
      >
        <div className="animate-in fade-in h-full duration-500">
          <GraphCanvas
            onSelect={handleSelectNode}
            onDeselect={() => setSelectedNode(null)}
            linkedinProfile={linkedinState?.status === "profile" ? linkedinState.profile : null}
            stravaProfile={stravaState?.status === "profile" ? stravaState.profile : null}
            mrkollProfile={mrkollState?.status === "profile" ? mrkollState.profile : null}
            krafmanProfile={krafmanState?.status === "profile" ? krafmanState.profile : null}
            showCompanyNode={activeCompany !== null}
          />
        </div>
      </main>

      {/* Right detail panel */}
      <DetailPanel
        source={selectedNode}
        onClose={handleClosePanel}
        linkedinState={linkedinState}
        onSelectLinkedInResult={handleSelectLinkedInResult}
        onRetryLinkedInSearch={handleRetryLinkedInSearch}
        stravaState={stravaState}
        onSelectStravaResult={handleSelectStravaResult}
        onRetryStravaSearch={handleRetryStravaSearch}
        mrkollState={mrkollState}
        onSelectMrkollResult={handleSelectMrkollResult}
        onRetryMrkollSearch={handleRetryMrkollSearch}
        onOpenCompany={handleOpenCompany}
        krafmanState={krafmanState}
      />
    </div>
  )
}
