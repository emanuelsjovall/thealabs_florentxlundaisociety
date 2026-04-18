import { load } from "cheerio";

import type {
  StravaActivity,
  StravaActivityDetail,
  StravaProfile,
  StravaResult,
  StravaSportType,
} from "@/lib/strava/strava.types";

const BASE_URL = "https://www.strava.com";
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

const SPORT_TYPE_MAP: Record<string, StravaSportType> = {
  Run: "Run",
  Ride: "Bike",
  EBikeRide: "EBike",
  VirtualRide: "VRide",
  Swim: "Swim",
  Hike: "Hike",
  Walk: "Walk",
  AlpineSki: "Ski",
  NordicSki: "Ski",
  BackcountrySki: "Ski",
  RockClimbing: "Climbing",
  Yoga: "Yoga",
  Workout: "Workout",
  WeightTraining: "Weight",
  Kitesurf: "Kitesurf",
  Golf: "Golf",
};

interface RawActivity {
  readonly id: number;
  readonly name: string;
  readonly sport_type: string;
  readonly start_time: string;
  readonly distance_raw: number;
  readonly moving_time_raw: number;
  readonly elapsed_time_raw: number;
  readonly elevation_gain_raw: number | null;
  readonly has_latlng: boolean;
  readonly static_map: string | null;
  readonly activity_url: string;
}

interface TrainingActivitiesResponse {
  readonly models: readonly RawActivity[];
  readonly page: number;
  readonly perPage: number;
  readonly total: number;
}

function toActivity(raw: RawActivity): StravaActivity {
  return {
    id: String(raw.id),
    title: raw.name,
    sportType: SPORT_TYPE_MAP[raw.sport_type] ?? "Sport",
    datetime: raw.start_time,
    distanceMeters: raw.distance_raw ?? null,
    movingTimeSeconds: raw.moving_time_raw ?? null,
    elapsedTimeSeconds: raw.elapsed_time_raw ?? null,
    elevationMeters: raw.elevation_gain_raw ?? null,
    hasMap: raw.has_latlng,
    mapUrl: raw.static_map ?? null,
    activityUrl: raw.activity_url,
  };
}

function normalizeAssetUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }

  if (trimmed.startsWith("/")) {
    return new URL(trimmed, BASE_URL).toString();
  }

  return trimmed;
}

export class StravaScraper {
  private readonly cookie: string;

  constructor(cookie: string) {
    this.cookie = cookie;
  }

  private async fetchJson<T>(path: string): Promise<T> {
    const response = await fetch(`${BASE_URL}${path}`, {
      headers: {
        "User-Agent": USER_AGENT,
        Cookie: this.cookie,
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
    });

    if (response.status === 401 || response.status === 403) {
      throw new SessionExpiredError();
    }

    if (!response.ok) {
      throw new Error(`Strava returned ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  private async fetchHtml(path: string): Promise<string> {
    const response = await fetch(`${BASE_URL}${path}`, {
      headers: {
        "User-Agent": USER_AGENT,
        Cookie: this.cookie,
      },
      redirect: "follow",
    });

    const html = await response.text();

    if (
      html.includes("class='logged-out") ||
      html.includes('class="logged-out')
    ) {
      throw new SessionExpiredError();
    }

    return html;
  }

  async scrapeAthleteProfile(
    athleteId: string
  ): Promise<StravaResult<StravaProfile>> {
    try {
      // Fetch profile page for name + avatar
      const html = await this.fetchHtml(`/athletes/${athleteId}`);
      const $ = load(html);

      const name =
        $("h1.text-title1, h1.athlete-name").first().text().trim() || null;

      const avatarEl = $('[data-react-class="AvatarWrapper"]').first();
      const avatarProps = avatarEl.attr("data-react-props");
      const profileImageUrl = avatarProps
        ? (JSON.parse(avatarProps) as { readonly src?: string }).src ?? null
        : null;

      // Fetch all activities via paginated JSON API
      const activities = await this.fetchAllActivities(athleteId);

      return {
        ok: true,
        data: {
          athleteId,
          name,
          profileImageUrl,
          totalActivities: activities.total,
          activities: activities.items,
        },
      };
    } catch (error) {
      if (error instanceof SessionExpiredError) {
        return {
          ok: false,
          error: "Not authenticated — session cookie may have expired",
          code: "SESSION_EXPIRED",
        };
      }
      const message =
        error instanceof Error ? error.message : "Unknown error";
      return { ok: false, error: message, code: "NETWORK_ERROR" };
    }
  }

  async scrapeActivity(
    activityId: string
  ): Promise<StravaResult<StravaActivityDetail>> {
    try {
      const html = await this.fetchHtml(`/activities/${activityId}`);
      const $ = load(html);

      const title = $("h1").first().text().trim() || null;

      // Sport type from page title (e.g. "Afternoon Run | Run | Strava")
      const pageTitle = $("title").text();
      const sportMatch = pageTitle.match(/\|\s*(\w+)\s*\|/);
      const sportType: StravaSportType =
        SPORT_TYPE_MAP[sportMatch?.[1] ?? ""] ?? "Sport";

      // Location
      const location =
        $('[class*="location"]').first().text().trim() || null;

      // Stats from inline-stats
      const statsText = $(".inline-stats").text();
      const distanceMatch = statsText.match(/([\d.,]+)\s*km\s*Distance/);
      const distanceMeters = distanceMatch
        ? parseFloat(distanceMatch[1].replace(",", "")) * 1000
        : null;

      const movingTimeMatch = statsText.match(
        /(\d+):(\d+)\s*Moving Time/
      );
      const movingTimeSeconds = movingTimeMatch
        ? parseInt(movingTimeMatch[1], 10) * 60 +
          parseInt(movingTimeMatch[2], 10)
        : null;

      const paceMatch = statsText.match(/([\d:]+\s*\/km)/);
      const pace = paceMatch?.[1]?.trim() ?? null;

      // More stats
      const moreStatsText = $(".section").text();
      const elevMatch = moreStatsText.match(/Elevation\s*([\d.,]+)\s*m/);
      const elevationMeters = elevMatch
        ? parseFloat(elevMatch[1].replace(",", ""))
        : null;

      const calMatch = moreStatsText.match(/Calories\s*([\d.,]+)/);
      const calories = calMatch
        ? parseInt(calMatch[1].replace(",", ""), 10)
        : null;

      const elapsedMatch = moreStatsText.match(
        /Elapsed Time\s*(\d+):(\d+)/
      );
      const elapsedTimeSeconds = elapsedMatch
        ? parseInt(elapsedMatch[1], 10) * 60 +
          parseInt(elapsedMatch[2], 10)
        : null;

      // Datetime from ActivityTagging react props
      const taggingEl = $('[data-react-class="ActivityTagging"]');
      const taggingProps = taggingEl.attr("data-react-props");
      let datetime = "";
      if (taggingProps) {
        const parsed = JSON.parse(taggingProps) as {
          readonly activityId?: number;
        };
        // Use the activity ID to construct URL reference
        datetime = parsed.activityId ? "" : "";
      }

      // Try to get datetime from time element
      const timeEl = $("time");
      datetime = timeEl.attr("datetime") ?? "";

      // Kudos & comments
      const kudosEl = $('[data-react-class="ADPKudosAndComments"]');
      let kudosCount = 0;
      let commentsCount = 0;
      if (kudosEl.length) {
        const props = JSON.parse(
          kudosEl.attr("data-react-props") ?? "{}"
        ) as {
          readonly kudosCount?: number;
          readonly commentsCount?: number;
        };
        kudosCount = props.kudosCount ?? 0;
        commentsCount = props.commentsCount ?? 0;
      }

      // Achievements
      const achievements: string[] = [];
      $("[class*=achievement] li, .best-effort").each((_, el) => {
        const text = $(el).text().trim().replace(/\s+/g, " ");
        if (text) achievements.push(text);
      });

      // Description
      const description =
        $(".activity-description")
          .first()
          .text()
          .trim()
          .replace(/Add a description/i, "") || null;

      const mapUrl = normalizeAssetUrl(
        [
          $('meta[property="og:image"]').attr("content"),
          $('meta[name="twitter:image"]').attr("content"),
          $("img.activity-map").first().attr("src"),
          $('[class*="map"] img').first().attr("src"),
        ].find((candidate) => candidate?.trim())
      );

      return {
        ok: true,
        data: {
          id: activityId,
          title: title ?? "",
          sportType,
          datetime,
          location,
          distanceMeters,
          movingTimeSeconds,
          elapsedTimeSeconds,
          elevationMeters,
          calories,
          pace,
          kudosCount,
          commentsCount,
          achievements,
          mapUrl,
          activityUrl: `${BASE_URL}/activities/${activityId}`,
          description,
        },
      };
    } catch (error) {
      if (error instanceof SessionExpiredError) {
        return {
          ok: false,
          error: "Not authenticated — session cookie may have expired",
          code: "SESSION_EXPIRED",
        };
      }
      const message =
        error instanceof Error ? error.message : "Unknown error";
      return { ok: false, error: message, code: "NETWORK_ERROR" };
    }
  }

  private async fetchAllActivities(
    athleteId: string
  ): Promise<{ readonly total: number; readonly items: StravaActivity[] }> {
    const perPage = 100;
    const allActivities: StravaActivity[] = [];
    let page = 1;
    let total = 0;

    while (true) {
      const data = await this.fetchJson<TrainingActivitiesResponse>(
        `/athlete/training_activities?athlete_id=${athleteId}&per_page=${perPage}&page=${page}`
      );

      total = data.total;
      const activities = data.models.map(toActivity);
      allActivities.push(...activities);

      if (allActivities.length >= total || activities.length < perPage) {
        break;
      }

      page++;
    }

    return { total, items: allActivities };
  }
}

class SessionExpiredError extends Error {
  constructor() {
    super("Session expired");
  }
}
