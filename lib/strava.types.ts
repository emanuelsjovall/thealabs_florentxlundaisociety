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

export interface StravaProfile {
  readonly athleteId: string;
  readonly name: string | null;
  readonly profileImageUrl: string | null;
  readonly totalActivities: number;
  readonly activities: readonly StravaActivity[];
}
