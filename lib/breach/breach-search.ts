import type {
  BreachField,
  BreachRecord,
  BreachSearchOptions,
  BreachSearchResult,
  Result,
} from "./breach.types"

const API_URL = "https://breach.vip/api/search"

export async function searchBreach(
  term: string,
  fields: BreachField[],
  options: BreachSearchOptions = {},
): Promise<Result<BreachSearchResult>> {
  const { wildcard = false, caseSensitive = false, categories } = options

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }

  const apiKey = process.env.BREACH_API_KEY
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`
  }

  const body: Record<string, unknown> = {
    term,
    fields,
    wildcard,
    case_sensitive: caseSensitive,
  }
  if (categories && categories.length > 0) {
    body.categories = categories
  }

  let response: Response
  try {
    response = await fetch(API_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    })
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Network error",
      code: "NETWORK_ERROR",
    }
  }

  if (response.status === 400) {
    const text = await response.text().catch(() => "Bad request")
    return { ok: false, error: text, code: "BAD_REQUEST" }
  }

  if (response.status === 429) {
    return {
      ok: false,
      error: "Rate limited — 15 requests per minute max",
      code: "RATE_LIMITED",
    }
  }

  if (response.status >= 500) {
    return { ok: false, error: `Server error (${response.status})`, code: "SERVER_ERROR" }
  }

  if (!response.ok) {
    return {
      ok: false,
      error: `Unexpected status ${response.status}`,
      code: "SERVER_ERROR",
    }
  }

  let json: { results: BreachRecord[] }
  try {
    json = await response.json()
  } catch {
    return { ok: false, error: "Failed to parse response JSON", code: "SERVER_ERROR" }
  }

  return {
    ok: true,
    data: {
      term,
      searchedAt: new Date().toISOString(),
      count: json.results.length,
      results: json.results,
    },
  }
}
