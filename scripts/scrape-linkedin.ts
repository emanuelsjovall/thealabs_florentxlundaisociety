import { config } from "dotenv";
config({ path: ".env.local" });

import { scrapeLinkedInProfile } from "../lib/linkedin";

const url = "https://www.linkedin.com/in/antonio-krsoski/";

console.log(`Scraping ${url} ...\n`);

const result = await scrapeLinkedInProfile(url, { headless: false });

if (!result.ok) {
  console.error(`Failed: ${result.error} (${result.code})`);
  process.exit(1);
}

console.log(JSON.stringify(result.data, null, 2));
