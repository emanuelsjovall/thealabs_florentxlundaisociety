import { BaseOSINTAgent } from "../base-agent"
import { githubTools, runGitHubTool } from "../tools/github-tools"
import type { AgentConfig, OSINTTarget, ToolDefinition } from "../types"

export class GitHubOSINTAgent extends BaseOSINTAgent {
  private githubToken?: string

  constructor(config?: Partial<AgentConfig>, githubToken?: string) {
    super({
      name: "GitHubOSINTAgent",
      description: "Locates and profiles GitHub accounts using public APIs",
      ...config,
    })
    this.githubToken = githubToken
  }

  protected getTools(): ToolDefinition[] {
    return githubTools
  }

  protected async executeTool(
    name: string,
    input: Record<string, unknown>,
  ): Promise<string> {
    return runGitHubTool(name, input, this.githubToken)
  }

  protected buildSystemPrompt(target: OSINTTarget): string {
    return `You are a GitHub OSINT specialist. Your job is to locate and profile GitHub accounts linked to a target identity using only public GitHub APIs.

Strategy:
1. If a username is provided, fetch their GitHub profile directly and enumerate their repos and events.
2. If no GitHub username is given, search by name, email, or other clues using github_search_users.
3. Look at repos for README author info, commit email/names, linked social profiles.
4. Use github_search_commits to find commits by name or email that could reveal the GitHub handle.
5. Check public events for linked accounts mentioned in commit messages or PR descriptions.

Target context: ${JSON.stringify(target, null, 2)}

When done, output your findings inside <findings> tags as a JSON array with objects like:
{
  "platform": "github",
  "url": "https://github.com/username",
  "username": "username",
  "displayName": "...",
  "bio": "...",
  "metadata": { "repos": N, "followers": N, "publicEmail": "...", "location": "..." },
  "confidence": "high" | "medium" | "low"
}`
  }
}
