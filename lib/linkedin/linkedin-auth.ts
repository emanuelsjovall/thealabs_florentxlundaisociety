import { chromium } from "playwright";
import type { Browser, BrowserContext, Page } from "playwright";
import { existsSync, readFileSync, writeFileSync } from "fs";

import type { Result } from "@/lib/linkedin/linkedin-profile.types";

export interface BrowserSession {
  readonly browser: Browser;
  readonly context: BrowserContext;
  readonly page: Page;
}

const DEFAULT_SESSION_PATH = ".linkedin-session.json";

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

export async function launchBrowser(options?: {
  readonly headless?: boolean;
  readonly sessionPath?: string;
}): Promise<Result<BrowserSession>> {
  const headless = options?.headless ?? true;
  const sessionPath = options?.sessionPath ?? DEFAULT_SESSION_PATH;

  try {
    const browser = await chromium.launch({ headless });

    const hasSession = existsSync(sessionPath);
    const contextOptions = {
      userAgent: USER_AGENT,
      viewport: { width: 1280, height: 800 },
      ...(hasSession
        ? { storageState: JSON.parse(readFileSync(sessionPath, "utf-8")) }
        : {}),
    };

    const context = await browser.newContext(contextOptions);
    const page = await context.newPage();

    return { ok: true, data: { browser, context, page } };
  } catch {
    return {
      ok: false,
      error: "Failed to launch browser",
      code: "BROWSER_ERROR",
    };
  }
}

/** Check whether the current session is authenticated by navigating to the feed. */
export async function isSessionValid(page: Page): Promise<boolean> {
  try {
    await page.goto("https://www.linkedin.com/feed", {
      waitUntil: "domcontentloaded",
      timeout: 15_000,
    });
    const url = page.url();
    return url.includes("/feed");
  } catch {
    return false;
  }
}

export async function loginToLinkedIn(
  page: Page
): Promise<Result<void>> {
  const email = process.env.LINKEDIN_EMAIL;
  const password = process.env.LINKEDIN_PASSWORD;

  if (!email || !password) {
    return {
      ok: false,
      error: "LINKEDIN_EMAIL and LINKEDIN_PASSWORD must be set",
      code: "MISSING_CREDENTIALS",
    };
  }

  try {
    await page.goto("https://www.linkedin.com/login", {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });

    await page.locator("#username").fill(email);
    await page.locator("#password").fill(password);
    await page.locator('button[type="submit"]').click();

    await page.waitForURL((url) => !url.href.includes("/login"), {
      timeout: 30_000,
    });

    const currentUrl = page.url();

    if (currentUrl.includes("/checkpoint")) {
      return {
        ok: false,
        error:
          "LinkedIn security checkpoint detected — manual verification required",
        code: "SECURITY_CHECKPOINT",
      };
    }

    if (
      currentUrl.includes("/authwall") ||
      currentUrl.includes("/login")
    ) {
      return {
        ok: false,
        error: "Login failed — check credentials",
        code: "AUTH_FAILED",
      };
    }

    return { ok: true, data: undefined };
  } catch {
    return {
      ok: false,
      error: "Login timed out or failed",
      code: "AUTH_FAILED",
    };
  }
}

export async function saveSession(
  context: BrowserContext,
  filePath?: string
): Promise<void> {
  const path = filePath ?? DEFAULT_SESSION_PATH;
  const state = await context.storageState();
  writeFileSync(path, JSON.stringify(state), "utf-8");
}

export async function closeBrowser(
  session: BrowserSession
): Promise<void> {
  await session.context.close();
  await session.browser.close();
}
