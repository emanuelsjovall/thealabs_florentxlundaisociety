import type Anthropic from "@anthropic-ai/sdk"

export interface OSINTTarget {
  username?: string
  email?: string
  fullName?: string
  knownAccounts?: Partial<Record<string, string>>
}

export interface AgentFinding {
  platform: string
  url?: string
  username?: string
  displayName?: string
  bio?: string
  metadata?: Record<string, unknown>
  confidence: "high" | "medium" | "low"
}

export interface AgentResult {
  agentName: string
  target: OSINTTarget
  findings: AgentFinding[]
  rawNotes: string
  error?: string
}

export interface OSINTReport {
  target: OSINTTarget
  results: AgentResult[]
  summary: string
  timestamp: string
}

export type ToolDefinition = Anthropic.Tool

export interface AgentConfig {
  name: string
  description: string
  model?: string
  maxIterations?: number
  systemPrompt?: string
}
