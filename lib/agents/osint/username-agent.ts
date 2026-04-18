import { BaseOSINTAgent } from "../base-agent"
import { usernameTools, runUsernameTool } from "../tools/username-tools"
import type { AgentConfig, OSINTTarget, ToolDefinition } from "../types"

export class UsernameOSINTAgent extends BaseOSINTAgent {
  constructor(config?: Partial<AgentConfig>) {
    super({
      name: "UsernameOSINTAgent",
      description:
        "Discovers accounts across platforms using username enumeration and profile scraping",
      ...config,
    })
  }

  protected getTools(): ToolDefinition[] {
    return usernameTools
  }

  protected async executeTool(
    name: string,
    input: Record<string, unknown>,
  ): Promise<string> {
    return runUsernameTool(name, input)
  }

  protected buildSystemPrompt(target: OSINTTarget): string {
    return `You are a cross-platform username OSINT specialist. Your job is to find accounts on public platforms tied to the target identity.

Strategy:
1. If a username is provided, run check_username_across_platforms for that username immediately.
2. If the username contains numbers or special chars, also try common variants (drop numbers, change separators).
3. For any platform that returns a 200 (account exists), use fetch_public_profile_page to read their bio and extract clues (linked accounts, real name, location, email).
4. Pivot on any new usernames or aliases you discover in bios.
5. Prioritize platforms where presence is confirmed, and note cross-platform identity links.

Target context: ${JSON.stringify(target, null, 2)}

When done, output findings inside <findings> tags as a JSON array with objects like:
{
  "platform": "reddit",
  "url": "https://reddit.com/user/username",
  "username": "username",
  "displayName": "...",
  "bio": "...",
  "metadata": { "linkedAccounts": [...], "location": "..." },
  "confidence": "high" | "medium" | "low"
}`
  }
}
