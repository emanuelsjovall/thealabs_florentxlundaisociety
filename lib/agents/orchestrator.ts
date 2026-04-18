import Anthropic from "@anthropic-ai/sdk"
import type { AgentResult, OSINTReport, OSINTTarget } from "./types"
import { GitHubOSINTAgent } from "./osint/github-agent"
import { UsernameOSINTAgent } from "./osint/username-agent"

export interface OrchestratorOptions {
  githubToken?: string
  agents?: ("github" | "username")[]
  parallel?: boolean
}

export class OSINTOrchestrator {
  private client: Anthropic
  private options: OrchestratorOptions

  constructor(options: OrchestratorOptions = {}) {
    this.options = {
      agents: ["github", "username"],
      parallel: true,
      ...options,
    }
    this.client = new Anthropic()
  }

  async investigate(target: OSINTTarget): Promise<OSINTReport> {
    const agentInstances = this.buildAgents()
    let results: AgentResult[]

    if (this.options.parallel) {
      results = await Promise.all(agentInstances.map((a) => a.run(target)))
    } else {
      results = []
      for (const agent of agentInstances) {
        results.push(await agent.run(target))
      }
    }

    const summary = await this.synthesize(target, results)

    return {
      target,
      results,
      summary,
      timestamp: new Date().toISOString(),
    }
  }

  private buildAgents() {
    const selected = this.options.agents ?? ["github", "username"]
    const agents = []

    if (selected.includes("github")) {
      agents.push(new GitHubOSINTAgent({}, this.options.githubToken))
    }
    if (selected.includes("username")) {
      agents.push(new UsernameOSINTAgent())
    }

    return agents
  }

  // Use Claude to synthesize a final narrative report from all agent results
  private async synthesize(
    target: OSINTTarget,
    results: AgentResult[],
  ): Promise<string> {
    const allFindings = results.flatMap((r) => r.findings)
    const rawNotes = results.map((r) => `## ${r.agentName}\n${r.rawNotes}`).join("\n\n")

    const response = await this.client.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 4096,
      thinking: { type: "adaptive" },
      messages: [
        {
          role: "user",
          content: `You are a senior OSINT analyst. Synthesize the following agent findings into a concise intelligence report.

Target: ${JSON.stringify(target, null, 2)}

Confirmed findings (${allFindings.length} total):
${JSON.stringify(allFindings, null, 2)}

Agent notes:
${rawNotes}

Write a structured report covering:
1. Confirmed accounts with confidence levels
2. Cross-platform identity links discovered
3. Key personal details (name, email, location if found publicly)
4. Gaps or unresolved leads
5. Recommended next steps

Be concise and factual. Only include what was actually found.`,
        },
      ],
    })

    return response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
  }
}
