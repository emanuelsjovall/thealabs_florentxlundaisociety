import Anthropic from "@anthropic-ai/sdk"
import type { AgentConfig, AgentResult, OSINTTarget, ToolDefinition } from "./types"

export abstract class BaseOSINTAgent {
  protected client: Anthropic
  protected config: AgentConfig

  constructor(config: AgentConfig) {
    this.config = {
      model: "claude-opus-4-7",
      maxIterations: 15,
      ...config,
    }
    this.client = new Anthropic()
  }

  // Subclasses declare which tools they expose
  protected abstract getTools(): ToolDefinition[]

  // Subclasses implement actual tool execution
  protected abstract executeTool(
    name: string,
    input: Record<string, unknown>,
  ): Promise<string>

  // Subclasses provide a focused system prompt
  protected abstract buildSystemPrompt(target: OSINTTarget): string

  async run(target: OSINTTarget): Promise<AgentResult> {
    const messages: Anthropic.MessageParam[] = [
      {
        role: "user",
        content: this.buildUserPrompt(target),
      },
    ]

    let rawNotes = ""
    let iterations = 0

    while (iterations < (this.config.maxIterations ?? 15)) {
      iterations++

      const response = await this.client.messages.create({
        model: this.config.model!,
        max_tokens: 8096,
        thinking: { type: "adaptive" },
        system: this.buildSystemPrompt(target),
        tools: this.getTools(),
        messages,
      })

      // Accumulate any text output from this turn
      for (const block of response.content) {
        if (block.type === "text") rawNotes += block.text + "\n"
      }

      if (response.stop_reason === "end_turn") break

      if (response.stop_reason === "tool_use") {
        messages.push({ role: "assistant", content: response.content })

        const toolResults: Anthropic.ToolResultBlockParam[] = []
        for (const block of response.content) {
          if (block.type === "tool_use") {
            let toolOutput: string
            try {
              toolOutput = await this.executeTool(
                block.name,
                block.input as Record<string, unknown>,
              )
            } catch (e) {
              toolOutput = JSON.stringify({ error: String(e) })
            }
            toolResults.push({
              type: "tool_result",
              tool_use_id: block.id,
              content: toolOutput,
            })
          }
        }
        messages.push({ role: "user", content: toolResults })
        continue
      }

      // pause_turn: append and re-send
      if (response.stop_reason === "pause_turn") {
        messages.push({ role: "assistant", content: response.content })
        continue
      }

      break
    }

    return this.parseResult(target, rawNotes)
  }

  protected buildUserPrompt(target: OSINTTarget): string {
    const parts: string[] = ["Investigate the following target and use your tools to gather intelligence:"]
    if (target.username) parts.push(`Username: ${target.username}`)
    if (target.email) parts.push(`Email: ${target.email}`)
    if (target.fullName) parts.push(`Full name: ${target.fullName}`)
    if (target.knownAccounts) {
      for (const [platform, handle] of Object.entries(target.knownAccounts)) {
        parts.push(`Known ${platform} account: ${handle}`)
      }
    }
    parts.push(
      "\nBe methodical. Use all available tools. After gathering data, summarize findings in structured JSON at the end wrapped in <findings>...</findings> tags.",
    )
    return parts.join("\n")
  }

  // Extract <findings> JSON block from raw notes, fall back to empty
  protected parseResult(target: OSINTTarget, rawNotes: string): AgentResult {
    const match = rawNotes.match(/<findings>([\s\S]*?)<\/findings>/)
    let findings: AgentResult["findings"] = []

    if (match) {
      try {
        const parsed = JSON.parse(match[1].trim())
        findings = Array.isArray(parsed) ? parsed : [parsed]
      } catch {
        // findings stay empty; raw notes still preserved
      }
    }

    return {
      agentName: this.config.name,
      target,
      findings,
      rawNotes: rawNotes.trim(),
    }
  }
}
