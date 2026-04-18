import type { ToolDefinition } from "../types"

// Public platforms to probe for username presence
const PLATFORMS: Record<string, (u: string) => string> = {
  github: (u) => `https://github.com/${u}`,
  gitlab: (u) => `https://gitlab.com/${u}`,
  twitter: (u) => `https://twitter.com/${u}`,
  instagram: (u) => `https://instagram.com/${u}`,
  reddit: (u) => `https://reddit.com/user/${u}`,
  hackernews: (u) => `https://news.ycombinator.com/user?id=${u}`,
  devto: (u) => `https://dev.to/${u}`,
  medium: (u) => `https://medium.com/@${u}`,
  npm: (u) => `https://www.npmjs.com/~${u}`,
  pypi: (u) => `https://pypi.org/user/${u}/`,
  keybase: (u) => `https://keybase.io/${u}`,
  linkedin: (u) => `https://linkedin.com/in/${u}`,
  stackoverflow: (u) =>
    `https://stackoverflow.com/users?tab=Reputation&filter=all&search=${u}`,
}

export const usernameTools: ToolDefinition[] = [
  {
    name: "check_username_across_platforms",
    description:
      "Check if a username exists on multiple public platforms by probing their profile URLs. Returns which platforms return a 200 OK (account likely exists) vs 404.",
    input_schema: {
      type: "object",
      properties: {
        username: {
          type: "string",
          description: "The username to search across platforms",
        },
        platforms: {
          type: "array",
          items: { type: "string" },
          description: `Subset of platforms to check. Available: ${Object.keys(PLATFORMS).join(", ")}. Leave empty to check all.`,
        },
      },
      required: ["username"],
    },
  },
  {
    name: "fetch_public_profile_page",
    description:
      "Fetch the raw text/HTML of a public profile page URL to extract bio, links, and identity clues. Use on URLs found during investigation.",
    input_schema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "Full URL of the profile page to fetch",
        },
      },
      required: ["url"],
    },
  },
]

export async function runUsernameTool(
  name: string,
  input: Record<string, unknown>,
): Promise<string> {
  switch (name) {
    case "check_username_across_platforms": {
      const username = input.username as string
      const requestedPlatforms = input.platforms as string[] | undefined
      const toCheck = requestedPlatforms?.length
        ? requestedPlatforms.filter((p) => p in PLATFORMS)
        : Object.keys(PLATFORMS)

      const results = await Promise.allSettled(
        toCheck.map(async (platform) => {
          const url = PLATFORMS[platform](username)
          try {
            const res = await fetch(url, {
              method: "HEAD",
              headers: { "User-Agent": "osint-agent/1.0" },
              redirect: "follow",
            })
            return { platform, url, status: res.status, exists: res.status === 200 }
          } catch {
            return { platform, url, status: -1, exists: false, error: "fetch failed" }
          }
        }),
      )

      const mapped = results.map((r) =>
        r.status === "fulfilled" ? r.value : { error: r.reason },
      )
      return JSON.stringify(mapped, null, 2)
    }

    case "fetch_public_profile_page": {
      const url = input.url as string
      // Only allow http/https to prevent SSRF to internal hosts
      if (!/^https?:\/\//i.test(url)) {
        return JSON.stringify({ error: "Only http/https URLs are allowed" })
      }
      try {
        const res = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; osint-agent/1.0)",
            Accept: "text/html,application/xhtml+xml",
          },
        })
        const text = await res.text()
        // Strip HTML tags and collapse whitespace for readable output
        const stripped = text
          .replace(/<script[\s\S]*?<\/script>/gi, "")
          .replace(/<style[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s{2,}/g, " ")
          .trim()
          .slice(0, 4000)
        return JSON.stringify({ url, status: res.status, content: stripped })
      } catch (e) {
        return JSON.stringify({ url, error: String(e) })
      }
    }

    default:
      throw new Error(`Unknown username tool: ${name}`)
  }
}
