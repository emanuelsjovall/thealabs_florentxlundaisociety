import type { ToolDefinition } from "../types"

export const githubTools: ToolDefinition[] = [
  {
    name: "github_search_users",
    description:
      "Search GitHub for user accounts by username, full name, email, or location. Returns a list of matching users with their profile URLs.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "Search query. Supports qualifiers like: user:name, fullname:Name, location:city, email:addr, repos:>5",
        },
        per_page: {
          type: "number",
          description: "Number of results to return (max 30)",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "github_get_user_profile",
    description:
      "Fetch the full public profile for a specific GitHub username including repos, followers, bio, location, blog, and email if public.",
    input_schema: {
      type: "object",
      properties: {
        username: { type: "string", description: "GitHub username" },
      },
      required: ["username"],
    },
  },
  {
    name: "github_list_user_repos",
    description:
      "List public repositories for a GitHub user, sorted by recently updated. Returns repo names, descriptions, languages, and star counts.",
    input_schema: {
      type: "object",
      properties: {
        username: { type: "string", description: "GitHub username" },
        per_page: {
          type: "number",
          description: "Number of repos to return (max 30)",
        },
      },
      required: ["username"],
    },
  },
  {
    name: "github_get_user_events",
    description:
      "Fetch recent public activity events for a GitHub user (commits, PRs, issues, comments). Useful to confirm activity and find linked identities.",
    input_schema: {
      type: "object",
      properties: {
        username: { type: "string", description: "GitHub username" },
        per_page: {
          type: "number",
          description: "Number of events to return (max 30)",
        },
      },
      required: ["username"],
    },
  },
  {
    name: "github_search_commits",
    description:
      "Search GitHub commits by author name or email. Returns commits with author info, timestamps, and repo context. Useful for uncovering real names/emails.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "Commit search query. Example: 'author-name:Alice author-email:alice@example.com'",
        },
        per_page: {
          type: "number",
          description: "Number of results (max 30)",
        },
      },
      required: ["query"],
    },
  },
]

// Tool handler — executes the actual GitHub API calls
export async function runGitHubTool(
  name: string,
  input: Record<string, unknown>,
  githubToken?: string,
): Promise<string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "osint-agent/1.0",
  }
  if (githubToken) {
    headers["Authorization"] = `Bearer ${githubToken}`
  }

  const get = async (url: string) => {
    const res = await fetch(url, { headers })
    if (!res.ok) {
      const err = await res.text()
      throw new Error(`GitHub API ${res.status}: ${err}`)
    }
    return res.json()
  }

  switch (name) {
    case "github_search_users": {
      const q = encodeURIComponent(input.query as string)
      const per = input.per_page ?? 10
      const data = await get(
        `https://api.github.com/search/users?q=${q}&per_page=${per}`,
      )
      return JSON.stringify(
        (data as { items: unknown[] }).items.slice(0, per as number),
        null,
        2,
      )
    }
    case "github_get_user_profile": {
      const data = await get(
        `https://api.github.com/users/${input.username}`,
      )
      return JSON.stringify(data, null, 2)
    }
    case "github_list_user_repos": {
      const per = input.per_page ?? 10
      const data = await get(
        `https://api.github.com/users/${input.username}/repos?sort=updated&per_page=${per}`,
      )
      return JSON.stringify(data, null, 2)
    }
    case "github_get_user_events": {
      const per = input.per_page ?? 10
      const data = await get(
        `https://api.github.com/users/${input.username}/events/public?per_page=${per}`,
      )
      return JSON.stringify(data, null, 2)
    }
    case "github_search_commits": {
      const q = encodeURIComponent(input.query as string)
      const per = input.per_page ?? 10
      const data = await get(
        `https://api.github.com/search/commits?q=${q}&per_page=${per}`,
      )
      return JSON.stringify(data, null, 2)
    }
    default:
      throw new Error(`Unknown GitHub tool: ${name}`)
  }
}
