"use client"

import Link from "next/link"
import { useState, useCallback, useEffect, type ElementType } from "react"
import { useParams } from "next/navigation"
import {
  MapPin,
  Mail,
  Phone,
  Globe,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
} from "lucide-react"
import { GraphCanvas } from "@/components/graph-canvas"
import { DetailPanel } from "@/components/detail-panel"
import type {
  LinkedInPanelState,
  StravaPanelState,
  MrkollPanelState,
  KrafmanPanelState,
  TwitterPanelState,
  GithubPanelState,
  BreachPanelState,
} from "@/components/detail-panel"
import { cn } from "@/lib/utils"
import type { LinkedInSearchResult } from "@/lib/linkedin"
import type { StravaSearchResult } from "@/lib/strava"
import type {
  MrkollSearchResult,
  MrkollCompanyEngagement,
} from "@/lib/mrkoll.types"
import type { TwitterSearchResult } from "@/lib/twitter-api"
import { normalizeTwitterUsername } from "@/lib/twitter-api"
import type { GithubSearchResult } from "@/lib/github-api"
import { normalizeGithubLogin } from "@/lib/github-api"
import {
  buildDefaultPerson,
  extractTwitterUsername,
  type UserPerson,
  type UserRecordData,
  type UserRecordPatch,
} from "@/lib/user-record"
import type { PersonalNote } from "@/lib/personal-note"

function ContactRow({
  icon: Icon,
  text,
}: {
  readonly icon: ElementType
  readonly text: string
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3 w-3 shrink-0 text-neutral-700" />
      <span className="truncate text-[11px] text-neutral-500">{text}</span>
    </div>
  )
}

interface PersonNodeProps {
  readonly person: UserPerson
  readonly expanded: boolean
  readonly onSelect: () => void
  readonly onToggle: () => void
}

function PersonNode({ person, expanded, onSelect, onToggle }: PersonNodeProps) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-[#0b0b0b] p-4 transition-colors hover:border-neutral-700">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[9px] tracking-[0.2em] text-neutral-600">
          SUBJECT
        </span>
        <button
          type="button"
          onClick={onToggle}
          className="rounded p-0.5 text-neutral-700 transition-colors hover:bg-neutral-900 hover:text-neutral-500"
          aria-label={expanded ? "Collapse subject" : "Expand subject"}
        >
          {expanded ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </button>
      </div>

      <button
        type="button"
        onClick={onSelect}
        className="text-left text-sm font-light text-foreground transition-colors hover:text-neutral-200"
      >
        {person.name}
      </button>

      <div
        className={cn(
          "grid transition-all duration-300",
          expanded ? "mt-3 grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="space-y-2 border-t border-neutral-800 pt-3">
            <ContactRow
              icon={MapPin}
              text={[person.city, person.state].filter(Boolean).join(", ")}
            />
            <ContactRow icon={Mail} text={person.email} />
            <ContactRow icon={Phone} text={person.phone} />
            <ContactRow icon={Globe} text={person.website} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function UserPage() {
  const params = useParams<{ userId: string }>()
  const userId = params.userId

  const [targetName, setTargetName] = useState("")
  const [loading, setLoading] = useState(true)
  const [selectedNode, setSelectedNode] = useState<
    | "subject"
    | "linkedin"
    | "x"
    | "strava"
    | "mrkoll"
    | "company"
    | "breach"
    | "github"
    | "notes"
    | null
  >(null)
  const [subjectExpanded, setSubjectExpanded] = useState(true)
  const [linkedinState, setLinkedinState] = useState<LinkedInPanelState | null>(
    null
  )
  const [stravaState, setStravaState] = useState<StravaPanelState | null>(null)
  const [mrkollState, setMrkollState] = useState<MrkollPanelState | null>(null)
  const [krafmanState, setKrafmanState] = useState<KrafmanPanelState | null>(
    null
  )
  const [breachState, setBreachState] = useState<BreachPanelState | null>(null)
  const [activeCompany, setActiveCompany] =
    useState<MrkollCompanyEngagement | null>(null)
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
          if (data.data.mrkoll) {
            setMrkollState({ status: "profile", profile: data.data.mrkoll })
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

  /* ─── Mrkoll ─── */

  const handleMrkollSelect = useCallback(async () => {
    if (mrkollState?.status === "profile") {
      setSelectedNode("mrkoll")
      return
    }

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
        setMrkollState({
          status: "search-results",
          results: data.data,
          query: targetName,
        })
      } else {
        setMrkollState({ status: "error", message: data.error })
      }
    } catch {
      setMrkollState({ status: "error", message: "Failed to search Mrkoll" })
    }
  }, [mrkollState, targetName])

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
        setMrkollState({
          status: "search-results",
          results: data.data,
          query: searchQuery,
        })
      } else {
        setMrkollState({ status: "error", message: data.error })
      }
    } catch {
      setMrkollState({ status: "error", message: "Failed to search Mrkoll" })
    }
  }, [])

  const loadKrafmanCompany = useCallback(
    async (company: MrkollCompanyEngagement) => {
      if (!company.krafmanUrl) return

      setActiveCompany(company)
      setKrafmanState({ status: "scraping", companyName: company.companyName })
      void saveUserRecord({ activeCompany: company })

      try {
        const res = await fetch("/api/krafman/scrape", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: company.krafmanUrl }),
        })
        const data = await res.json()

        if (data.ok) {
          setKrafmanState({ status: "profile", profile: data.data })
          await saveUserRecord({
            activeCompany: company,
            krafman: data.data,
          })
        } else {
          setKrafmanState({ status: "error", message: data.error })
        }
      } catch {
        setKrafmanState({ status: "error", message: "Failed to load company" })
      }
    },
    [saveUserRecord]
  )

  const handleSelectMrkollResult = useCallback(
    async (result: MrkollSearchResult) => {
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
          await saveUserRecord({
            mrkoll: data.data,
            activeCompany: firstCompanyWithKrafman ?? null,
          })
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
    },
    [loadKrafmanCompany, saveUserRecord]
  )

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

  /* ─── Krafman ─── */

  const handleOpenCompany = useCallback(
    (company: MrkollCompanyEngagement) => {
      if (company.krafmanUrl) {
        loadKrafmanCompany(company)
        setSelectedNode("company")
      }
    },
    [loadKrafmanCompany]
  )

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
        | "mrkoll"
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
      } else if (source === "mrkoll") {
        handleMrkollSelect()
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
      handleMrkollSelect,
      handleTwitterSelect,
      handleBreachSelect,
    ]
  )

  const handleClosePanel = useCallback(() => {
    setSelectedNode(null)
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
      <aside className="fixed inset-y-0 left-0 z-30 flex w-72 flex-col border-r border-neutral-800 bg-background p-6">
        <div className="mb-6">
          <span className="font-mono text-xs tracking-[0.3em] text-neutral-500">
            THEA
          </span>
          <p className="mt-1.5 text-[10px] tracking-[0.2em] text-neutral-600 uppercase">
            is looking for
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Link
            href="/"
            className="inline-flex w-fit items-center gap-2 rounded-md px-1 py-1 font-mono text-[10px] tracking-[0.2em] text-neutral-500 uppercase transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" />
            <span>Back to homescreen</span>
          </Link>

          <PersonNode
            person={subject}
            expanded={subjectExpanded}
            onSelect={handleSelectSubject}
            onToggle={() => setSubjectExpanded(!subjectExpanded)}
          />
        </div>
      </aside>

      {/* Main */}
      <main
        style={{
          marginLeft: "288px",
          height: "100%",
        }}
      >
        <div className="h-full animate-in duration-500 fade-in">
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
            mrkollProfile={
              mrkollState?.status === "profile" ? mrkollState.profile : null
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
        </div>
      </main>

      {/* Right detail panel */}
      <DetailPanel
        source={selectedNode}
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
          mrkollProfile:
            mrkollState?.status === "profile" ? mrkollState.profile : null,
          githubProfile:
            githubState?.status === "profile" ? githubState.profile : null,
        }}
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
