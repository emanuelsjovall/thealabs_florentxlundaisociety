export { githubTools, runGitHubTool } from "./github-tools"
export { usernameTools, runUsernameTool } from "./username-tools"

import { githubTools } from "./github-tools"
import { usernameTools } from "./username-tools"

export const allOsintTools = [...githubTools, ...usernameTools]
