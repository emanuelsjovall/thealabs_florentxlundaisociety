import { load } from "cheerio";

import type {
  StravaResult,
  StravaSearchResult,
} from "@/lib/strava/strava.types";

const BASE_URL = "https://www.strava.com";
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

export async function searchStravaAthletes(
  name: string
): Promise<StravaResult<readonly StravaSearchResult[]>> {
  const cookie = process.env.STRAVA_COOKIE;

  if (!cookie) {
    return {
      ok: false,
      error: "STRAVA_COOKIE environment variable must be set",
      code: "MISSING_CREDENTIALS",
    };
  }

  try {
    const searchUrl = `${BASE_URL}/athletes/search?utf8=%E2%9C%93&text=${encodeURIComponent(name)}`;
    console.log(`[strava-search] fetching ${searchUrl}`);

    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent": USER_AGENT,
        Cookie: cookie,
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });

    const html = await response.text();
    const $ = load(html);
    const results: StravaSearchResult[] = [];

    // Strava uses React class names like AthleteList_athleteListItem__*
    // Each result is an <li> inside the athlete list
    $("ul[class*='AthleteList'] > li").each((_, el) => {
      const $el = $(el);

      // Name link: <a href="/athletes/12345">Name</a> inside athleteInfo div
      const infoDiv = $el.find("div[class*='athleteInfo']");
      const nameLink = infoDiv.find("a").first();
      const nameText = nameLink.text().trim();
      const href = nameLink.attr("href") ?? "";

      // Location/subtitle: <p> tag after the name link
      const location = infoDiv.find("p").first().text().trim() || null;

      // Avatar image
      const imgSrc =
        $el.find("div[class*='imgWrapper'] img").attr("src") ?? null;

      const athleteUrl = href.startsWith("http")
        ? href
        : `${BASE_URL}${href}`;

      if (nameText && href) {
        results.push({
          name: nameText,
          location,
          profileImageUrl: imgSrc,
          athleteUrl,
        });
      }
    });

    console.log(`[strava-search] found ${results.length} results`);
    return { ok: true, data: results };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return { ok: false, error: message, code: "NETWORK_ERROR" };
  }
}
