export interface ResultSuccess<TData> {
  readonly ok: true;
  readonly data: TData;
}

export interface ResultError {
  readonly ok: false;
  readonly error: string;
  readonly code: LinkedInErrorCode;
}

export type Result<TData> = ResultSuccess<TData> | ResultError;

export type LinkedInErrorCode =
  | "MISSING_CREDENTIALS"
  | "AUTH_FAILED"
  | "SECURITY_CHECKPOINT"
  | "RATE_LIMITED"
  | "PROFILE_NOT_FOUND"
  | "BROWSER_ERROR"
  | "PARSE_ERROR"
  | "NETWORK_ERROR";

export interface LinkedInExperience {
  readonly positionTitle: string | null;
  readonly companyName: string | null;
  readonly companyLinkedInUrl: string | null;
  readonly fromDate: string | null;
  readonly toDate: string | null;
  readonly duration: string | null;
  readonly location: string | null;
  readonly description: string | null;
}

export interface LinkedInEducation {
  readonly institutionName: string | null;
  readonly degree: string | null;
  readonly fieldOfStudy: string | null;
  readonly fromDate: string | null;
  readonly toDate: string | null;
  readonly description: string | null;
}

export interface LinkedInSkill {
  readonly name: string;
  readonly endorsementCount: number | null;
}

export interface LinkedInPost {
  readonly text: string | null;
  readonly date: string | null;
  readonly likes: number | null;
  readonly comments: number | null;
  readonly reposts: number | null;
  /** Present after scrape with repost detection: true when LinkedIn framed this activity as a repost/reshare. */
  readonly isRepost?: boolean;
}

export interface LinkedInProfile {
  readonly linkedInUrl: string;
  readonly name: string | null;
  readonly headline: string | null;
  readonly location: string | null;
  readonly about: string | null;
  readonly profileImageUrl: string | null;
  readonly experiences: readonly LinkedInExperience[];
  readonly educations: readonly LinkedInEducation[];
  readonly skills: readonly LinkedInSkill[];
  readonly posts: readonly LinkedInPost[];
}

export interface ScrapeLinkedInProfileOptions {
  readonly headless?: boolean;
  readonly sessionPath?: string;
  readonly timeout?: number;
}

export interface LinkedInSearchResult {
  readonly name: string;
  readonly headline: string | null;
  readonly profileUrl: string;
  readonly connectionDegree: string | null;
  readonly profileImageUrl: string | null;
}
