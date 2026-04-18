"use client"

import Link from "next/link"
import { useState, useCallback, useEffect } from "react"
import { useParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { GraphCanvas } from "@/components/graph-canvas"
import { TimelineCanvas } from "@/components/timeline-canvas"
import { DetailPanel } from "@/components/detail-panel"
import { ChatPanel } from "@/components/chat-panel"
import type { TimelineEvent, TimelineCluster } from "@/lib/timeline-types"
import type {
  LinkedInPanelState,
  StravaPanelState,
  KrafmanPanelState,
  TwitterPanelState,
  GithubPanelState,
  BreachPanelState,
} from "@/components/detail-panel"
import type { LinkedInSearchResult } from "@/lib/linkedin"
import type { StravaSearchResult } from "@/lib/strava"
import type { TwitterSearchResult } from "@/lib/twitter-api"
import { normalizeTwitterUsername } from "@/lib/twitter-api"
import type { GithubSearchResult } from "@/lib/github-api"
import { normalizeGithubLogin } from "@/lib/github-api"
import {
  buildDefaultPerson,
  extractTwitterUsername,
  type ActiveCompanyEngagement,
  type UserPerson,
  type UserRecordData,
  type UserRecordPatch,
} from "@/lib/user-record"
import type { PersonalNote } from "@/lib/personal-note"

interface PersonNodeProps {
  readonly person: UserPerson
  readonly onSelect: () => void
}

function PersonNode({ person, onSelect }: PersonNodeProps) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-[#0b0b0b] p-4 transition-colors hover:border-neutral-700">
      <button
        type="button"
        onClick={onSelect}
        className="text-left text-sm font-light text-foreground transition-colors hover:text-neutral-200"
      >
        {person.name}
      </button>
    </div>
  )
}

export default function UserPage() {
  const params = useParams<{ userId: string }>()
  const userId = params.userId

  const [targetName, setTargetName] = useState("")
  const [loading, setLoading] = useState(true)
  const [chatActive, setChatActive] = useState(false)
  const [selectedNode, setSelectedNode] = useState<
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
  >(null)
  const [activeView, setActiveView] = useState<"graph" | "timeline">("graph")
  const [selectedTimelineEvent, setSelectedTimelineEvent] = useState<TimelineEvent | null>(null)
  const [selectedCluster, setSelectedCluster] = useState<TimelineCluster | null>(null)
  const [highlightedEventId, setHighlightedEventId] = useState<string | null>(null)
  const [linkedinState, setLinkedinState] = useState<LinkedInPanelState | null>(
    null
  )
  const [stravaState, setStravaState] = useState<StravaPanelState | null>(null)
  const [krafmanState, setKrafmanState] = useState<KrafmanPanelState | null>(
    null
  )
  const [breachState, setBreachState] = useState<BreachPanelState | null>(null)
  const [activeCompany, setActiveCompany] =
    useState<ActiveCompanyEngagement | null>(null)
  const [person, setPerson] = useState<UserPerson | null>(null)
  const [twitterState, setTwitterState] = useState<TwitterPanelState | null>(
    null
  )
  const [githubState, setGithubState] = useState<GithubPanelState | null>(null)
  const [subjectUpdatedAt, setSubjectUpdatedAt] = useState<string | null>(null)
  const [notes, setNotes] = useState<PersonalNote[]>([])

  const saveUserRecord = useCallback(
    async (patch: UserRecordPatch): Promise<UserRecordData | null> => {
      try {
        const response = await fetch(`/api/users/${userId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        })
        const data = (await response.json()) as {
          ok: boolean
          data?: UserRecordData
        }

        if (!data.ok || !data.data) {
          return null
        }

        setSubjectUpdatedAt(data.data.updatedAt ?? null)
        return data.data
      } catch {
        return null
      }
    },
    [userId]
  )

  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then((res) => res.json())
      .then((data: { ok: boolean; data?: UserRecordData }) => {
        if (data.ok && data.data) {
          setTargetName(data.data.name)
          setPerson(data.data.person ?? buildDefaultPerson(data.data.name))
          if (data.data.twitter) {
            setTwitterState({
              status: "profile",
              profile: data.data.twitter,
            })
          }
          if (data.data.github) {
            setGithubState({
              status: "profile",
              profile: data.data.github,
            })
          }
          setSubjectUpdatedAt(data.data.updatedAt ?? null)
          if (data.data.linkedin) {
            setLinkedinState({ status: "profile", profile: data.data.linkedin })
          }
          if (data.data.strava) {
            setStravaState({ status: "profile", profile: data.data.strava })
          }
          if (data.data.activeCompany) {
            setActiveCompany(data.data.activeCompany)
          }
          if (data.data.krafman) {
            setKrafmanState({ status: "profile", profile: data.data.krafman })
          }
          if (data.data.breach) {
            setBreachState({ status: "results", data: data.data.breach })
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [userId])

  useEffect(() => {
    fetch(`/api/users/${userId}/notes`)
      .then((res) => res.json())
      .then(
        (data: { ok: boolean; data?: PersonalNote[] }) => {
          if (data.ok && data.data) {
            setNotes(data.data)
          }
        }
      )
      .catch(() => {})
  }, [userId])

  const syncTwitterProfile = useCallback(
    async (username: string, force: boolean = false) => {
      const u = normalizeTwitterUsername(username)
      if (!u) {
        setTwitterState({
          status: "error",
          message: "Enter a valid X username.",
        })
        return
      }

      setSelectedNode("x")
      setTwitterState({ status: "syncing", username: u })

      try {
        const response = await fetch("/api/twitter/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            username: u,
            force,
          }),
        })
        const data = (await response.json()) as {
          ok: boolean
          data?: UserRecordData
          error?: string
        }

        if (data.ok && data.data?.twitter) {
          setTwitterState({
            status: "profile",
            profile: data.data.twitter,
          })
          setSubjectUpdatedAt(data.data.updatedAt ?? null)
        } else {
          setTwitterState({
            status: "error",
            message: data.error ?? "Failed to load X profile",
          })
        }
      } catch {
        setTwitterState({
          status: "error",
          message: "Failed to load X profile",
        })
      }
    },
    [userId]
  )

  const handleRetryTwitterSearch = useCallback(async (searchQuery: string) => {
    setTwitterState({ status: "searching" })

    try {
      const res = await fetch("/api/twitter/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: searchQuery }),
      })
      const data = await res.json()

      if (data.ok) {
        setTwitterState({
          status: "search-results",
          results: data.data,
          query: searchQuery,
        })
      } else {
        setTwitterState({ status: "error", message: data.error })
      }
    } catch {
      setTwitterState({
        status: "error",
        message: "Failed to search X",
      })
    }
  }, [])

  const handleSelectTwitterResult = useCallback(
    async (result: TwitterSearchResult) => {
      await syncTwitterProfile(result.screenName, false)
    },
    [syncTwitterProfile]
  )

  const handleRefreshTwitter = useCallback(() => {
    if (twitterState?.status !== "profile") {
      return
    }
    const u = extractTwitterUsername(twitterState.profile, null)
    void syncTwitterProfile(u, true)
  }, [syncTwitterProfile, twitterState])

  const syncGithubProfile = useCallback(
    async (rawLogin: string, force: boolean = false) => {
      const login = normalizeGithubLogin(rawLogin)
      if (!login) {
        setGithubState({
          status: "error",
          message: "Enter a valid GitHub username.",
        })
        return
      }

      setSelectedNode("github")
      setGithubState({ status: "syncing", username: login })

      try {
        const response = await fetch("/api/github/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            username: login,
            force,
          }),
        })
        const data = (await response.json()) as {
          ok: boolean
          data?: UserRecordData
          error?: string
        }

        if (data.ok && data.data?.github) {
          setGithubState({
            status: "profile",
            profile: data.data.github,
          })
          setSubjectUpdatedAt(data.data.updatedAt ?? null)
        } else {
          setGithubState({
            status: "error",
            message: data.error ?? "Failed to load GitHub profile",
          })
        }
      } catch {
        setGithubState({
          status: "error",
          message: "Failed to load GitHub profile",
        })
      }
    },
    [userId]
  )

  const handleRetryGithubSearch = useCallback(async (searchQuery: string) => {
    setGithubState({ status: "searching" })

    try {
      const res = await fetch("/api/github/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery }),
      })
      const data = await res.json()

      if (data.ok) {
        setGithubState({
          status: "search-results",
          results: data.data,
          query: searchQuery,
        })
      } else {
        setGithubState({ status: "error", message: data.error })
      }
    } catch {
      setGithubState({
        status: "error",
        message: "Failed to search GitHub",
      })
    }
  }, [])

  const handleSelectGithubResult = useCallback(
    async (result: GithubSearchResult) => {
      await syncGithubProfile(result.login, false)
    },
    [syncGithubProfile]
  )

  const handleRefreshGithub = useCallback(() => {
    if (githubState?.status !== "profile") {
      return
    }
    void syncGithubProfile(githubState.profile.login, true)
  }, [syncGithubProfile, githubState])

  const handleGithubSelect = useCallback(async () => {
    if (githubState?.status === "profile") {
      setSelectedNode("github")
      return
    }

    setSelectedNode("github")
    setGithubState({ status: "searching" })

    try {
      const res = await fetch("/api/github/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: targetName }),
      })
      const data = await res.json()

      if (data.ok) {
        setGithubState({
          status: "search-results",
          results: data.data,
          query: targetName,
        })
      } else {
        setGithubState({ status: "error", message: data.error })
      }
    } catch {
      setGithubState({
        status: "error",
        message: "Failed to search GitHub",
      })
    }
  }, [githubState, targetName])

  /* ─── LinkedIn ─── */

  const handleLinkedinSelect = useCallback(async () => {
    if (linkedinState?.status === "profile") {
      setSelectedNode("linkedin")
      return
    }

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
        setLinkedinState({
          status: "search-results",
          results: data.data,
          query: targetName,
        })
      } else {
        setLinkedinState({ status: "error", message: data.error })
      }
    } catch {
      setLinkedinState({
        status: "error",
        message: "Failed to search LinkedIn",
      })
    }
  }, [linkedinState, targetName])

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
        setLinkedinState({
          status: "search-results",
          results: data.data,
          query: searchQuery,
        })
      } else {
        setLinkedinState({ status: "error", message: data.error })
      }
    } catch {
      setLinkedinState({
        status: "error",
        message: "Failed to search LinkedIn",
      })
    }
  }, [])

  const handleSelectLinkedInResult = useCallback(
    async (result: LinkedInSearchResult) => {
      setLinkedinState({ status: "scraping", name: result.name })

      try {
        const res = await fetch("/api/linkedin/scrape", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: result.profileUrl,
            searchName: targetName,
          }),
        })
        const data = await res.json()

        if (data.ok) {
          setLinkedinState({ status: "profile", profile: data.data })
          await saveUserRecord({
            linkedin: data.data,
            linkedinUrl: data.data.linkedInUrl.replace(/\/$/, ""),
          })
        } else {
          setLinkedinState({ status: "error", message: data.error })
        }
      } catch {
        setLinkedinState({
          status: "error",
          message: "Failed to scrape profile",
        })
      }
    },
    [saveUserRecord, targetName]
  )

  /* ─── Strava ─── */

  const handleStravaSelect = useCallback(async () => {
    if (stravaState?.status === "profile") {
      setSelectedNode("strava")
      return
    }

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
        setStravaState({
          status: "search-results",
          results: data.data,
          query: targetName,
        })
      } else {
        setStravaState({ status: "error", message: data.error })
      }
    } catch {
      setStravaState({ status: "error", message: "Failed to search Strava" })
    }
  }, [stravaState, targetName])

  const handleSelectStravaResult = useCallback(
    async (result: StravaSearchResult) => {
      setStravaState({ status: "scraping", name: result.name })

      const athleteId = result.athleteUrl
        .split("/athletes/")[1]
        ?.replace(/\/$/, "")
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
          await saveUserRecord({ strava: data.data })
        } else {
          setStravaState({ status: "error", message: data.error })
        }
      } catch {
        setStravaState({
          status: "error",
          message: "Failed to load athlete profile",
        })
      }
    },
    [saveUserRecord]
  )

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
        setStravaState({
          status: "search-results",
          results: data.data,
          query: searchQuery,
        })
      } else {
        setStravaState({ status: "error", message: data.error })
      }
    } catch {
      setStravaState({ status: "error", message: "Failed to search Strava" })
    }
  }, [])

  /* ─── Breach ─── */

  const handleBreachSelect = useCallback(async () => {
    if (breachState?.status === "results") {
      setSelectedNode("breach")
      return
    }

    setSelectedNode("breach")
    setBreachState({ status: "searching" })

    try {
      const res = await fetch("/api/breach/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: targetName }),
      })
      const data = await res.json()

      if (data.ok) {
        setBreachState({ status: "results", data: data.data })
        await saveUserRecord({ breach: data.data })
      } else {
        setBreachState({ status: "error", message: data.error })
      }
    } catch {
      setBreachState({ status: "error", message: "Failed to search breach records" })
    }
  }, [breachState, targetName, saveUserRecord])

  const handleSelectSubject = useCallback(() => {
    setSelectedNode("subject")
  }, [])

  const handleTwitterSelect = useCallback(async () => {
    if (twitterState?.status === "profile") {
      setSelectedNode("x")
      return
    }

    setSelectedNode("x")
    setTwitterState({ status: "searching" })

    try {
      const res = await fetch("/api/twitter/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: targetName }),
      })
      const data = await res.json()

      if (data.ok) {
        setTwitterState({
          status: "search-results",
          results: data.data,
          query: targetName,
        })
      } else {
        setTwitterState({ status: "error", message: data.error })
      }
    } catch {
      setTwitterState({
        status: "error",
        message: "Failed to search X",
      })
    }
  }, [twitterState, targetName])

  const handleCreateNote = useCallback(async () => {
    try {
      const response = await fetch(`/api/users/${userId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "" }),
      })
      const data = (await response.json()) as {
        ok: boolean
        data?: PersonalNote
      }
      if (data.ok && data.data) {
        const created = data.data
        setNotes((prev) => [created, ...prev])
      }
    } catch {
      /* ignore */
    }
  }, [userId])

  const handleSaveNote = useCallback(
    async (noteId: string, content: string) => {
      try {
        const response = await fetch(`/api/users/${userId}/notes/${noteId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        })
        const data = (await response.json()) as {
          ok: boolean
          data?: PersonalNote
        }
        if (data.ok && data.data) {
          const updated = data.data
          setNotes((prev) => {
            const next = prev.map((n) => (n.id === noteId ? updated : n))
            return [...next].sort(
              (a, b) =>
                new Date(b.updatedAt).getTime() -
                new Date(a.updatedAt).getTime()
            )
          })
        }
      } catch {
        /* ignore */
      }
    },
    [userId]
  )

  const handleDeleteNote = useCallback(
    async (noteId: string) => {
      try {
        const response = await fetch(`/api/users/${userId}/notes/${noteId}`, {
          method: "DELETE",
        })
        const data = (await response.json()) as { ok: boolean }
        if (data.ok) {
          setNotes((prev) => prev.filter((n) => n.id !== noteId))
        }
      } catch {
        /* ignore */
      }
    },
    [userId]
  )

  /* ─── Node Selection ─── */

  const handleSelectNode = useCallback(
    (
      source:
        | "linkedin"
        | "x"
        | "github"
        | "strava"
        | "company"
        | "breach"
        | "notes"
    ) => {
      if (source === "linkedin") {
        handleLinkedinSelect()
      } else if (source === "x") {
        handleTwitterSelect()
      } else if (source === "github") {
        handleGithubSelect()
      } else if (source === "strava") {
        handleStravaSelect()
      } else if (source === "breach") {
        handleBreachSelect()
      } else {
        setSelectedNode(source)
      }
    },
    [
      handleLinkedinSelect,
      handleGithubSelect,
      handleStravaSelect,
      handleTwitterSelect,
      handleBreachSelect,
    ]
  )

  const handleClosePanel = useCallback(() => {
    setSelectedNode(null)
    setSelectedTimelineEvent(null)
    setSelectedCluster(null)
    setHighlightedEventId(null)
  }, [])

  const handleTimelineEventSelect = useCallback((event: TimelineEvent) => {
    setSelectedTimelineEvent(event)
    setSelectedCluster(null)
    setHighlightedEventId(null)
    setSelectedNode("timeline-event")
  }, [])

  const handleClusterSelect = useCallback((cluster: TimelineCluster) => {
    setSelectedCluster(cluster)
    setSelectedTimelineEvent(null)
    setHighlightedEventId(null)
    setSelectedNode("timeline-cluster")
  }, [])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <span className="font-mono text-xs tracking-[0.3em] text-neutral-500">
          Loading...
        </span>
      </div>
    )
  }

  if (!targetName) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <span className="font-mono text-xs tracking-[0.3em] text-neutral-500">
          User not found
        </span>
      </div>
    )
  }

  const subject = person ?? buildDefaultPerson(targetName)

  return (
    <div className="relative h-screen overflow-hidden bg-background">
      {/* Dot grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "radial-gradient(circle, white 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Left sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 flex w-56 flex-col border-r border-neutral-800 bg-background p-5">
        <div className="mb-6 shrink-0">
          <Link
            href="/"
            className="mb-4 inline-flex w-fit items-center gap-2 whitespace-nowrap rounded-md px-1 py-1 font-mono text-[10px] tracking-[0.15em] text-neutral-500 uppercase transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3 shrink-0" />
            <span>Back to homescreen</span>
          </Link>
          <span className="block font-mono text-xs tracking-[0.3em] text-neutral-500">
            THEA
          </span>
          <p className="mt-1.5 text-[10px] tracking-[0.2em] text-neutral-600 uppercase">
            is looking for
          </p>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-2">
          <PersonNode person={subject} onSelect={handleSelectSubject} />
        </div>
      </aside>

      {/* Main */}
      <main
        className="flex flex-col"
        style={{
          marginLeft: "224px",
          marginRight: selectedNode ? "420px" : "0px",
          transition: "margin 500ms cubic-bezier(0.4, 0, 0.2, 1)",
          height: "100%",
        }}
      >
        {/* View toggle */}
        <div className="absolute top-4 left-1/2 z-20 -translate-x-1/2 flex items-center gap-0 rounded-lg border border-neutral-800 bg-background/80 backdrop-blur-sm p-0.5">
          <button
            type="button"
            onClick={() => setActiveView("graph")}
            className={cn(
              "rounded-md px-3 py-1.5 font-mono text-[9px] tracking-[0.2em] transition-colors",
              activeView === "graph"
                ? "bg-neutral-800 text-foreground"
                : "text-neutral-600 hover:text-neutral-400"
            )}
          >
            GRAPH
          </button>
          <button
            type="button"
            onClick={() => setActiveView("timeline")}
            className={cn(
              "rounded-md px-3 py-1.5 font-mono text-[9px] tracking-[0.2em] transition-colors",
              activeView === "timeline"
                ? "bg-neutral-800 text-foreground"
                : "text-neutral-600 hover:text-neutral-400"
            )}
          >
            TIMELINE
          </button>
        </div>

        <div
          className="relative min-h-0"
          style={{
            flexGrow: chatActive ? 0 : 1,
            flexShrink: 1,
            flexBasis: 0,
            opacity: chatActive ? 0 : 1,
            overflow: "hidden",
            transition: "flex-grow 450ms cubic-bezier(0.4, 0, 0.2, 1), opacity 300ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {activeView === "graph" ? (
            <GraphCanvas
              onSelect={handleSelectNode}
              onDeselect={() => setSelectedNode(null)}
              linkedinProfile={
                linkedinState?.status === "profile" ? linkedinState.profile : null
              }
              twitterProfile={
                twitterState?.status === "profile" ? twitterState.profile : null
              }
              githubProfile={
                githubState?.status === "profile" ? githubState.profile : null
              }
              stravaProfile={
                stravaState?.status === "profile" ? stravaState.profile : null
              }
              krafmanProfile={
                krafmanState?.status === "profile" ? krafmanState.profile : null
              }
              showCompanyNode={activeCompany !== null}
              breachResult={
                breachState?.status === "results" ? breachState.data : null
              }
              noteCount={notes.length}
              notesPreviewLine={
                notes[0]?.content.trim()
                  ? (notes[0].content.trim().split("\n")[0]?.slice(0, 120) ??
                    null)
                  : null
              }
            />
          ) : (
            <TimelineCanvas
              linkedinProfile={
                linkedinState?.status === "profile" ? linkedinState.profile : null
              }
              stravaProfile={
                stravaState?.status === "profile" ? stravaState.profile : null
              }
              twitterProfile={
                twitterState?.status === "profile" ? twitterState.profile : null
              }
              onEventSelect={handleTimelineEventSelect}
              onClusterSelect={handleClusterSelect}
              highlightedEventId={highlightedEventId}
            />
          )}
        </div>
        <ChatPanel userId={userId} onActiveChange={setChatActive} />
      </main>

      {/* Right detail panel */}
      <DetailPanel
        source={selectedNode}
        timelineEvent={selectedTimelineEvent}
        timelineCluster={selectedCluster}
        highlightedEventId={highlightedEventId}
        onClusterEventHighlight={setHighlightedEventId}
        onClose={handleClosePanel}
        subject={{
          name: targetName,
          email: subject.email,
          phone: subject.phone,
          website: subject.website,
          city: subject.city,
          state: subject.state,
          country: subject.country,
          updatedAt: subjectUpdatedAt,
          linkedinProfile:
            linkedinState?.status === "profile" ? linkedinState.profile : null,
          stravaProfile:
            stravaState?.status === "profile" ? stravaState.profile : null,
          githubProfile:
            githubState?.status === "profile" ? githubState.profile : null,
        }}
        linkedinState={linkedinState}
        onSelectLinkedInResult={handleSelectLinkedInResult}
        onRetryLinkedInSearch={handleRetryLinkedInSearch}
        stravaState={stravaState}
        onSelectStravaResult={handleSelectStravaResult}
        onRetryStravaSearch={handleRetryStravaSearch}
        krafmanState={krafmanState}
        twitterState={twitterState}
        onSelectTwitterResult={handleSelectTwitterResult}
        onRetryTwitterSearch={handleRetryTwitterSearch}
        onRefreshTwitter={handleRefreshTwitter}
        githubState={githubState}
        onSelectGithubResult={handleSelectGithubResult}
        onRetryGithubSearch={handleRetryGithubSearch}
        onRefreshGithub={handleRefreshGithub}
        breachState={breachState}
        notes={notes}
        onCreateNote={handleCreateNote}
        onSaveNote={handleSaveNote}
        onDeleteNote={handleDeleteNote}
      />
    </div>
  )
}
