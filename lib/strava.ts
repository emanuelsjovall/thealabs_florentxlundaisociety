import { StravaScraper } from "@/lib/strava-scraper";
import type { StravaProfile, StravaResult } from "@/lib/strava.types";

export async function scrapeStrava(
  username: string
): Promise<StravaResult<StravaProfile>> {
  const cookie = process.env.STRAVA_COOKIE;

  if (!cookie) {
    return {
      ok: false,
      error: "STRAVA_COOKIE environment variable must be set",
      code: "MISSING_CREDENTIALS",
    };
  }

  const scraper = new StravaScraper(cookie);

  try {
    return await scraper.scrapeAthleteProfile(username);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return { ok: false, error: message, code: "NETWORK_ERROR" };
  }
}
