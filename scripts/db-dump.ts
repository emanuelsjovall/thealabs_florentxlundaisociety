import { mkdirSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { spawnSync } from "node:child_process"
import { requireDatabaseUrl } from "./db-env"

const defaultPath = resolve(process.cwd(), "db/thea.dump.sql")
const outputPath = process.argv[2] ? resolve(process.cwd(), process.argv[2]) : defaultPath

const databaseUrl = requireDatabaseUrl()

mkdirSync(dirname(outputPath), { recursive: true })

const result = spawnSync(
  "pg_dump",
  ["--no-owner", "--no-acl", "--clean", "--if-exists", "-f", outputPath, databaseUrl],
  { stdio: "inherit", env: process.env }
)

if (result.error) {
  console.error(result.error.message)
  console.error("Install PostgreSQL client tools so `pg_dump` is on your PATH.")
  process.exit(1)
}

if (result.status !== 0) {
  process.exit(result.status ?? 1)
}

console.log(`Wrote ${outputPath}`)
