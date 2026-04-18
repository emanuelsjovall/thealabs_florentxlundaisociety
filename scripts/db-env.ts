import { config } from "dotenv"
import { resolve } from "node:path"

export function loadDatabaseEnv(): void {
  config({ path: resolve(process.cwd(), ".env.local") })
  config({ path: resolve(process.cwd(), ".env") })
}

export function requireDatabaseUrl(): string {
  loadDatabaseEnv()
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error("DATABASE_URL is not set. Add it to .env or .env.local.")
    process.exit(1)
  }
  return url
}
