"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface DashboardUser {
  readonly id: string
  readonly name: string
  readonly linkedinUrl: string | null
  readonly linkedin: { readonly headline?: string } | null
  readonly twitter: unknown
  readonly updatedAt: string
}

export default function Page() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [searching, setSearching] = useState(false)
  const [recentUsers, setRecentUsers] = useState<readonly DashboardUser[]>([])

  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) setRecentUsers(data.data)
      })
      .catch(() => {})
  }, [])

  async function handleSearch(): Promise<void> {
    const name = query.trim()
    if (!name || searching) return
    setSearching(true)

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      const data = await res.json()

      if (data.ok) {
        router.push(`/${data.data.id}`)
      }
    } catch {
      setSearching(false)
    }
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

      {/* Top bar */}
      <header className="absolute inset-x-0 top-0 z-10 flex items-center px-6 py-5">
        <span className="font-mono text-sm tracking-[0.3em] text-foreground">THEA</span>
      </header>

      {/* Main */}
      <main className="h-full">
        <div className={cn(
          "flex min-h-svh flex-col items-center justify-center px-4 pb-24",
          searching && "pointer-events-none scale-95 opacity-0 transition-all duration-500"
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
                disabled={!query.trim() || searching}
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

          {recentUsers.length > 0 && (
            <div className="mt-12 w-full max-w-2xl">
              <p className="mb-4 font-mono text-[9px] tracking-[0.2em] text-neutral-600">
                PREVIOUSLY SEARCHED
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {recentUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => router.push(`/${user.id}`)}
                    className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 text-left transition-colors hover:border-neutral-700"
                  >
                    <p className="truncate text-sm text-foreground">{user.name}</p>
                    <p className="mt-1 truncate text-xs text-neutral-600">
                      {user.linkedin?.headline ?? "No profile data"}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
