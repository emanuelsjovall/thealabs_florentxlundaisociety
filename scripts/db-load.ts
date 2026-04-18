import { existsSync } from "node:fs"
import { resolve } from "node:path"
import { spawnSync } from "node:child_process"
import { requireDatabaseUrl } from "./db-env"

const defaultPath = resolve(process.cwd(), "db/thea.dump.sql")
const inputPath = process.argv[2] ? resolve(process.cwd(), process.argv[2]) : defaultPath

if (!existsSync(inputPath)) {
  console.error(`Dump file not found: ${inputPath}`)
  console.error("Run `pnpm db:dump` first, or pass a path: `pnpm db:load ./path/to/dump.sql`")
  process.exit(1)
}

const databaseUrl = requireDatabaseUrl()

const result = spawnSync(
  "psql",
  ["-v", "ON_ERROR_STOP=1", "-f", inputPath, databaseUrl],
  { stdio: "inherit", env: process.env }
)

if (result.error) {
  console.error(result.error.message)
  console.error("Install PostgreSQL client tools so `psql` is on your PATH.")
  process.exit(1)
}

if (result.status !== 0) {
  process.exit(result.status ?? 1)
}

console.log(`Loaded ${inputPath}`)
