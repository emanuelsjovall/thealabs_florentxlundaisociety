export type StravaErrorCode =
  | "MISSING_CREDENTIALS"
  | "SESSION_EXPIRED"
  | "SCRAPE_ERROR"
  | "NETWORK_ERROR"
  | "PARSE_ERROR";

export type StravaResult<TData> =
  | { readonly ok: true; readonly data: TData }
  | { readonly ok: false; readonly error: string; readonly code: StravaErrorCode };

export type StravaSportType =
  | "Run"
  | "Bike"
  | "EBike"
  | "VRide"
  | "Swim"
  | "Hike"
  | "Walk"
  | "Ski"
  | "Climbing"
  | "Yoga"
  | "Workout"
  | "Weight"
  | "Kitesurf"
  | "Golf"
  | "Sport";

export interface StravaActivity {
  readonly id: string;
  readonly title: string;
  readonly sportType: StravaSportType;
  readonly datetime: string;
  readonly distanceMeters: number | null;
  readonly movingTimeSeconds: number | null;
  readonly elapsedTimeSeconds: number | null;
  readonly elevationMeters: number | null;
  readonly hasMap: boolean;
  readonly mapUrl: string | null;
  readonly activityUrl: string;
}

export interface StravaSearchResult {
  readonly name: string;
  readonly location: string | null;
  readonly profileImageUrl: string | null;
  readonly athleteUrl: string;
}

export interface StravaActivityDetail {
  readonly id: string;
  readonly title: string;
  readonly sportType: StravaSportType;
  readonly datetime: string;
  readonly location: string | null;
  readonly distanceMeters: number | null;
  readonly movingTimeSeconds: number | null;
  readonly elapsedTimeSeconds: number | null;
  readonly elevationMeters: number | null;
  readonly calories: number | null;
  readonly pace: string | null;
  readonly kudosCount: number;
  readonly commentsCount: number;
  readonly achievements: readonly string[];
  readonly mapUrl: string | null;
  readonly activityUrl: string;
  readonly description: string | null;
}

export interface StravaProfile {
  readonly athleteId: string;
  readonly name: string | null;
  readonly profileImageUrl: string | null;
  readonly totalActivities: number;
  readonly activities: readonly StravaActivity[];
}
