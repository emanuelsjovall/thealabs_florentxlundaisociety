export interface MrkollResultSuccess<TData> {
  readonly ok: true;
  readonly data: TData;
}

export interface MrkollResultError {
  readonly ok: false;
  readonly error: string;
  readonly code: MrkollErrorCode;
}

export type MrkollResult<TData> =
  | MrkollResultSuccess<TData>
  | MrkollResultError;

export type MrkollErrorCode =
  | "BROWSER_ERROR"
  | "BLOCKED"
  | "NO_RESULTS"
  | "PARSE_ERROR"
  | "NETWORK_ERROR"
  | "INVALID_URL";

export interface MrkollSearchResult {
  readonly name: string;
  readonly age: number | null;
  readonly address: string | null;
  readonly personnummer: string | null;
  readonly extraInfo: readonly string[];
  readonly profileUrl: string;
}

export interface MrkollHouseholdMember {
  readonly name: string;
  readonly age: number | null;
  readonly profileUrl: string | null;
}

export interface MrkollNeighbor {
  readonly name: string;
  readonly address: string | null;
  readonly profileUrl: string | null;
}

export interface MrkollCompanyEngagement {
  readonly companyName: string;
  readonly roles: readonly string[];
  readonly registrationYear: number | null;
  readonly orgNumber: string | null;
  readonly krafmanUrl: string | null;
}

export interface MrkollProfile {
  readonly url: string;
  readonly name: string;
  readonly age: number | null;
  readonly address: string | null;
  readonly location: string | null;
  readonly personnummer: string | null;
  readonly phoneNumbers: readonly string[];
  readonly companies: readonly MrkollCompanyEngagement[];
  readonly household: readonly MrkollHouseholdMember[];
  readonly propertyInfo: string | null;
  readonly neighbors: readonly MrkollNeighbor[];
  readonly rawHtml: string;
}

export interface MrkollScrapeOptions {
  readonly headless?: boolean;
  readonly timeout?: number;
}
