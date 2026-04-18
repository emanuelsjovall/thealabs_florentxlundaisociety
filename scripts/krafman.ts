import { krafmanUrl } from "../lib/krafman";

const url = process.argv[2];

if (!url) {
  console.error("Usage:");
  console.error("  pnpm krafman <url>   Scrape a company page");
  console.error();
  console.error("Example:");
  console.error(
    "  pnpm krafman https://krafman.se/nordic-kinetics-ab/5595212373/sammanfattning",
  );
  process.exit(1);
}

console.log(`Scraping company: ${url}\n`);

const result = await krafmanUrl(url);

if (!result.ok) {
  console.error(`Error: ${result.error} (${result.code})`);
  process.exit(1);
}

const c = result.data;
console.log(`Company: ${c.companyName}`);
console.log(`Org Number: ${c.orgNumber ?? "unknown"}`);
console.log(`Status: ${c.status ?? "unknown"}`);
console.log(`Registration Year: ${c.registrationYear ?? "unknown"}`);
console.log(`Legal Form: ${c.legalForm ?? "unknown"}`);
console.log(`Address: ${c.address ?? "unknown"}`);
console.log(`Location: ${c.location ?? "unknown"}`);
console.log(`Industry: ${c.industry ?? "unknown"}`);
console.log(`Description: ${c.description ?? "none"}`);
console.log(`Share Capital: ${c.shareCapital ?? "unknown"}`);
console.log(`F-tax: ${c.fTax === null ? "unknown" : c.fTax ? "Yes" : "No"}`);
console.log(
  `VAT: ${c.vatRegistered === null ? "unknown" : c.vatRegistered ? "Yes" : "No"}`,
);
console.log(
  `Employer: ${c.employerRegistered === null ? "unknown" : c.employerRegistered ? "Yes" : "No"}`,
);

if (c.boardMembers.length > 0) {
  console.log(`\nBoard & Management (${c.boardMembers.length}):`);
  for (const m of c.boardMembers) {
    console.log(
      `  ${m.role}: ${m.name}${m.age ? `, ${m.age} år` : ""}`,
    );
    if (m.engagementCount) {
      console.log(`    Engagements: ${m.engagementCount}`);
    }
    if (m.profileUrl) {
      console.log(`    Profile: ${m.profileUrl}`);
    }
  }
}

if (c.debt) {
  console.log(`\nDebt Info (${c.debt.date ?? "unknown date"}):`);
  console.log(`  General: ${c.debt.generalDebt ?? "unknown"}`);
  console.log(`  Individual: ${c.debt.individualDebt ?? "unknown"}`);
  if (c.debt.paymentRemarks !== null) {
    console.log(`  Payment Remarks: ${c.debt.paymentRemarks}`);
  }
}
