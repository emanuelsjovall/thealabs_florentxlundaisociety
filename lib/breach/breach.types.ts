export type BreachErrorCode =
  | "RATE_LIMITED"
  | "BAD_REQUEST"
  | "NETWORK_ERROR"
  | "SERVER_ERROR"

export type BreachField =
  | "domain"
  | "steamid"
  | "phone"
  | "name"
  | "email"
  | "username"
  | "password"
  | "ip"
  | "discordid"
  | "uuid"

export type BreachRecord = Record<string, unknown>

export interface BreachSearchOptions {
  wildcard?: boolean
  caseSensitive?: boolean
  categories?: string[]
}

export interface BreachSearchResult {
  term: string
  searchedAt: string
  count: number
  results: readonly BreachRecord[]
}

export type Result<TData> =
  | { ok: true; data: TData }
  | { ok: false; error: string; code: BreachErrorCode }
