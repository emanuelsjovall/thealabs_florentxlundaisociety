import { searchBreach } from "../lib/breach"

const name = process.argv[2]

if (!name) {
  console.error("Usage: tsx scripts/search-breach.ts <name>")
  console.error('Example: tsx scripts/search-breach.ts "John Doe"')
  process.exit(1)
}

console.log(`[breach] Searching for name: "${name}"`)

const result = await searchBreach(name, ["name"])

if (!result.ok) {
  console.error(`[breach] Error (${result.code}): ${result.error}`)
  process.exit(1)
}

console.log(`[breach] Found ${result.data.count} result(s)\n`)

if (result.data.count === 0) {
  console.log("[breach] No results found.")
  process.exit(0)
}

for (let i = 0; i < result.data.results.length; i++) {
  console.log(`--- Result ${i + 1} ---`)
  console.log(JSON.stringify(result.data.results[i], null, 2))
  console.log()
}
