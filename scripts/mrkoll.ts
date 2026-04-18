import { mrkoll, mrkollUrl } from "../lib/mrkoll";

const arg1 = process.argv[2];
const arg2 = process.argv[3];

if (!arg1) {
  console.error("Usage:");
  console.error("  pnpm mrkoll <name> <location>   Search for a person");
  console.error("  pnpm mrkoll <url>               Scrape a profile URL");
  console.error();
  console.error("Examples:");
  console.error('  pnpm mrkoll "Hugo" "Stockholm"');
  console.error(
    "  pnpm mrkoll https://mrkoll.se/person/...",
  );
  process.exit(1);
}

// If first arg looks like a URL, use mrkollUrl
if (arg1.startsWith("http")) {
  console.log(`Scraping profile: ${arg1}\n`);

  const result = await mrkollUrl(arg1);

  if (!result.ok) {
    console.error(`Error: ${result.error} (${result.code})`);
    process.exit(1);
  }

  const p = result.data;
  console.log(`Name: ${p.name}`);
  console.log(`Age: ${p.age ?? "unknown"}`);
  console.log(`Address: ${p.address ?? "unknown"}`);
  console.log(`Location: ${p.location ?? "unknown"}`);
  console.log(`Personnummer: ${p.personnummer ?? "unknown"}`);
  console.log(
    `Phone: ${p.phoneNumbers.length > 0 ? p.phoneNumbers.join(", ") : "none"}`,
  );
  console.log(`Property: ${p.propertyInfo ?? "none"}`);

  if (p.companies.length > 0) {
    console.log(`\nCompanies (${p.companies.length}):`);
    for (const c of p.companies) {
      console.log(
        `  ${c.companyName}${c.orgNumber ? ` (${c.orgNumber})` : ""}`,
      );
      if (c.roles.length > 0) console.log(`    Roles: ${c.roles.join(", ")}`);
      if (c.registrationYear) console.log(`    Registered: ${c.registrationYear}`);
      if (c.krafmanUrl) console.log(`    Krafman: ${c.krafmanUrl}`);
    }
  }

  if (p.household.length > 0) {
    console.log(`\nHousehold (${p.household.length}):`);
    for (const m of p.household) {
      console.log(`  ${m.name}${m.age ? `, ${m.age} år` : ""}`);
    }
  }

  if (p.neighbors.length > 0) {
    console.log(`\nNeighbors (${p.neighbors.length}):`);
    for (const n of p.neighbors) {
      console.log(`  ${n.name}`);
    }
  }
} else {
  const location = arg2 || "";
  console.log(`Searching: "${arg1}" in "${location}"\n`);

  const result = await mrkoll(arg1, location);

  if (!result.ok) {
    console.error(`Error: ${result.error} (${result.code})`);
    process.exit(1);
  }

  console.log(`Found ${result.data.length} results:\n`);

  for (const [i, person] of result.data.entries()) {
    console.log(`${i + 1}. ${person.name}, ${person.age ?? "?"} år`);
    console.log(`   ${person.address ?? "no address"}`);
    if (person.extraInfo.length > 0) {
      console.log(`   ${person.extraInfo.join(" | ")}`);
    }
    console.log(`   ${person.profileUrl}`);
    console.log();
  }
}
