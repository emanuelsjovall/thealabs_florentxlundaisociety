import { config } from "dotenv";
config({ path: ".env.local" });
import { scrapeStrava } from "../lib/strava/strava";

async function main(): Promise<void> {
  const username = process.argv[2] ?? "florentxlunda";
  const result = await scrapeStrava(username);
  console.log(JSON.stringify(result, null, 2));
}

main();
