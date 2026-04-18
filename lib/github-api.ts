import type { GithubRepoSummary, UserGithubProfile } from "@/lib/user-record"

const GITHUB_API_BASE = "https://api.github.com"

export interface GithubSearchResult {
  readonly login: string
  readonly id: number
  readonly avatar_url: string
  readonly html_url: string
  readonly type: string
}

function authHeaders(): HeadersInit {
  const token =
    process.env.GITHUB_TOKEN?.trim() ?? process.env.GH_TOKEN?.trim()
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

async function readGithubError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { message?: string; documentation_url?: string }
    if (body.message) {
      return body.message
    }
  } catch {
    /* ignore */
  }
  return `GitHub API error ${res.status}`
}

async function githubJson<T>(path: string): Promise<T> {
  const url = `${GITHUB_API_BASE}${path}`
  const res = await fetch(url, {
    headers: authHeaders(),
    cache: "no-store",
  })

  if (!res.ok) {
    throw new Error(await readGithubError(res))
  }

  return (await res.json()) as T
}

/** Normalizes handles like `@foo`, `github.com/foo/bar`, or bare logins. */
export function normalizeGithubLogin(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) {
    return ""
  }

  const withoutHost = trimmed.replace(
    /^https?:\/\/(www\.)?github\.com\//i,
    ""
  )
  const withoutAt = withoutHost.replace(/^@+/, "")
  const segment = withoutAt.split("/")[0]?.replace(/\/$/, "") ?? ""

  return /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/.test(segment)
    ? segment
    : ""
}

interface SearchUsersResponse {
  readonly items?: ReadonlyArray<{
    readonly login: string
    readonly id: number
    readonly avatar_url: string
    readonly html_url: string
    readonly type: string
  }>
}

/**
 * User search — equivalent to GitHub’s web search with `type=users`.
 * Set `GITHUB_TOKEN` (or `GH_TOKEN`) for higher rate limits (recommended).
 */
export async function searchGithubUsers(
  query: string
): Promise<readonly GithubSearchResult[]> {
  const q = query.trim()
  if (!q) {
    return []
  }

  const searchParams = new URLSearchParams({
    q,
    per_page: "30",
  })

  const data = await githubJson<SearchUsersResponse>(
    `/search/users?${searchParams.toString()}`
  )

  const items = data.items ?? []
  return items.map((item) => ({
    login: item.login,
    id: item.id,
    avatar_url: item.avatar_url,
    html_url: item.html_url,
    type: item.type,
  }))
}

function mapRepo(raw: Record<string, unknown>): GithubRepoSummary {
  return {
    name: String(raw["name"] ?? ""),
    full_name: String(raw["full_name"] ?? ""),
    html_url: String(raw["html_url"] ?? ""),
    description:
      raw["description"] != null ? String(raw["description"]) : null,
    stargazers_count: Number(raw["stargazers_count"] ?? 0),
    language: raw["language"] != null ? String(raw["language"]) : null,
    fork: Boolean(raw["fork"]),
    archived: Boolean(raw["archived"]),
    pushed_at: raw["pushed_at"] != null ? String(raw["pushed_at"]) : null,
    updated_at: String(raw["updated_at"] ?? ""),
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
}

/**
 * Loads the public user/org object from GET /users/:login plus recent owned repos.
 * Mirrors the profile data shown on github.com/:login.
 */
export async function fetchGithubProfile(
  rawLogin: string
): Promise<UserGithubProfile> {
  const login = normalizeGithubLogin(rawLogin)
  if (!login) {
    throw new Error("Enter a valid GitHub username.")
  }

  const userUnknown = await githubJson<unknown>(`/users/${encodeURIComponent(login)}`)
  const user = asRecord(userUnknown)
  const resolvedLogin = String(user["login"] ?? login)

  const reposUnknown = await githubJson<unknown>(
    `/users/${encodeURIComponent(resolvedLogin)}/repos?per_page=40&sort=updated&type=owner`
  )

  const reposRaw = Array.isArray(reposUnknown)
    ? reposUnknown.map((r) => mapRepo(asRecord(r)))
    : []

  const synced = new Date()

  const apiUser = { ...user }

  return {
    login: resolvedLogin,
    github_numeric_id: Number(user["id"] ?? 0),
    node_id:
      user["node_id"] != null ? String(user["node_id"]) : undefined,
    avatar_url: String(user["avatar_url"] ?? ""),
    html_url: String(user["html_url"] ?? ""),
    gravatar_id:
      user["gravatar_id"] != null ? String(user["gravatar_id"]) : null,
    name: user["name"] != null ? String(user["name"]) : null,
    company: user["company"] != null ? String(user["company"]) : null,
    blog: user["blog"] != null ? String(user["blog"]) : null,
    location: user["location"] != null ? String(user["location"]) : null,
    email: user["email"] != null ? String(user["email"]) : null,
    bio: user["bio"] != null ? String(user["bio"]) : null,
    twitter_username:
      user["twitter_username"] != null
        ? String(user["twitter_username"])
        : null,
    hireable:
      user["hireable"] === null || user["hireable"] === undefined
        ? null
        : Boolean(user["hireable"]),
    type: String(user["type"] ?? "User"),
    site_admin: Boolean(user["site_admin"]),
    public_repos: Number(user["public_repos"] ?? 0),
    public_gists: Number(user["public_gists"] ?? 0),
    followers: Number(user["followers"] ?? 0),
    following: Number(user["following"] ?? 0),
    created_at: String(user["created_at"] ?? ""),
    updated_at: String(user["updated_at"] ?? ""),
    repos: reposRaw,
    api_user: apiUser,
    last_synced_at: synced.toISOString(),
  }
}
