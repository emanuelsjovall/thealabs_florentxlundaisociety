export interface KrafmanResultSuccess<TData> {
  readonly ok: true;
  readonly data: TData;
}

export interface KrafmanResultError {
  readonly ok: false;
  readonly error: string;
  readonly code: KrafmanErrorCode;
}

export type KrafmanResult<TData> =
  | KrafmanResultSuccess<TData>
  | KrafmanResultError;

export type KrafmanErrorCode =
  | "BROWSER_ERROR"
  | "BLOCKED"
  | "PARSE_ERROR"
  | "NETWORK_ERROR"
  | "INVALID_URL";

export interface KrafmanBoardMember {
  readonly name: string;
  readonly age: number | null;
  readonly role: string;
  readonly profileUrl: string | null;
  readonly engagementCount: number | null;
}

export interface KrafmanDebtInfo {
  readonly generalDebt: string | null;
  readonly individualDebt: string | null;
  readonly paymentRemarks: number | null;
  readonly date: string | null;
}

export interface KrafmanCompanyProfile {
  readonly url: string;
  readonly companyName: string;
  readonly orgNumber: string | null;
  readonly status: string | null;
  readonly registrationYear: number | null;
  readonly address: string | null;
  readonly location: string | null;
  readonly industry: string | null;
  readonly legalForm: string | null;
  readonly description: string | null;
  readonly shareCapital: string | null;
  readonly fTax: boolean | null;
  readonly vatRegistered: boolean | null;
  readonly employerRegistered: boolean | null;
  readonly boardMembers: readonly KrafmanBoardMember[];
  readonly debt: KrafmanDebtInfo | null;
  readonly rawHtml: string;
}

export interface KrafmanScrapeOptions {
  readonly headless?: boolean;
  readonly timeout?: number;
}
