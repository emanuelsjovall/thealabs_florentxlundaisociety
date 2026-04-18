import { load } from "cheerio";

import type {
  StravaActivity,
  StravaProfile,
  StravaResult,
  StravaSportType,
} from "@/lib/strava.types";

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

  private async fetchAllActivities(
    athleteId: string
  ): Promise<{ readonly total: number; readonly items: StravaActivity[] }> {
    const perPage = 100;
    const allActivities: StravaActivity[] = [];
    let page = 1;
    let total = 0;

    // eslint-disable-next-line no-constant-condition
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
