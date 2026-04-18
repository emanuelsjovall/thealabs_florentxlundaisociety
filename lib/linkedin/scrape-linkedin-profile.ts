import Anthropic from "@anthropic-ai/sdk";

import type {
  LinkedInPost,
  LinkedInProfile,
  Result,
  ScrapeLinkedInProfileOptions,
} from "@/lib/linkedin/linkedin-profile.types";
import {
  closeBrowser,
  isSessionValid,
  launchBrowser,
  loginToLinkedIn,
  saveSession,
} from "@/lib/linkedin/linkedin-auth";

const PROFILE_TOOL_SCHEMA = {
  name: "extract_profile",
  description: "Extract structured LinkedIn profile data from HTML",
  input_schema: {
    type: "object" as const,
    properties: {
      name: { type: ["string", "null"] as const },
      headline: { type: ["string", "null"] as const },
      location: { type: ["string", "null"] as const },
      about: { type: ["string", "null"] as const },
      profileImageUrl: { type: ["string", "null"] as const },
      experiences: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            positionTitle: { type: ["string", "null"] as const },
            companyName: { type: ["string", "null"] as const },
            companyLinkedInUrl: { type: ["string", "null"] as const },
            fromDate: { type: ["string", "null"] as const },
            toDate: { type: ["string", "null"] as const },
            duration: { type: ["string", "null"] as const },
            location: { type: ["string", "null"] as const },
            description: { type: ["string", "null"] as const },
          },
          required: [
            "positionTitle",
            "companyName",
            "companyLinkedInUrl",
            "fromDate",
            "toDate",
            "duration",
            "location",
            "description",
          ],
        },
      },
      educations: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            institutionName: { type: ["string", "null"] as const },
            degree: { type: ["string", "null"] as const },
            fieldOfStudy: { type: ["string", "null"] as const },
            fromDate: { type: ["string", "null"] as const },
            toDate: { type: ["string", "null"] as const },
            description: { type: ["string", "null"] as const },
          },
          required: [
            "institutionName",
            "degree",
            "fieldOfStudy",
            "fromDate",
            "toDate",
            "description",
          ],
        },
      },
      skills: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            name: { type: "string" as const },
            endorsementCount: { type: ["number", "null"] as const },
          },
          required: ["name", "endorsementCount"],
        },
      },
    },
    required: [
      "name",
      "headline",
      "location",
      "about",
      "profileImageUrl",
      "experiences",
      "educations",
      "skills",
    ],
  },
};

function log(msg: string): void {
  console.log(`[scraper] ${msg}`);
}

interface ScrollOptions {
  readonly step?: number;
  readonly delay?: number;
  readonly settleTime?: number;
  readonly maxPasses?: number;
}

async function scrollToBottom(
  page: import("playwright").Page,
  label: string,
  options?: ScrollOptions
): Promise<void> {
  const step = options?.step ?? 400;
  const delay = options?.delay ?? 400;
  const settleTime = options?.settleTime ?? 1_500;
  const maxPasses = options?.maxPasses ?? 5;

  let previousHeight = 0;
  for (let attempt = 0; attempt < maxPasses; attempt++) {
    const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
    log(`  scrolling ${label} (pass ${attempt + 1}, height: ${scrollHeight})`);

    await page.evaluate(
      async ({ step, delay }) => {
        for (let y = 0; y < document.body.scrollHeight; y += step) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, delay));
        }
      },
      { step, delay }
    );
    await page.waitForTimeout(settleTime);

    const currentHeight = await page.evaluate(
      () => document.body.scrollHeight
    );
    if (currentHeight === previousHeight) break;
    previousHeight = currentHeight;
  }
}

async function scrapePostsFromPage(
  page: import("playwright").Page
): Promise<readonly LinkedInPost[]> {
  return page.evaluate(() => {
    const posts: {
      text: string | null;
      date: string | null;
      likes: number | null;
      comments: number | null;
      reposts: number | null;
      isRepost: boolean;
    }[] = [];

    const containers = document.querySelectorAll(
      ".feed-shared-update-v2, [data-urn*='activity']"
    );

    for (const container of containers) {
      const headerText = container
        .querySelector(
          ".update-components-header__text-view, .feed-shared-update-v2__description-wrapper .update-components-header"
        )
        ?.textContent?.trim() ?? "";
      const isRepost = /reposted/i.test(headerText);

      const textEl = container.querySelector(
        ".feed-shared-update-v2__description .break-words, " +
        ".update-components-text .break-words, " +
        ".feed-shared-text .break-words, " +
        "span.break-words"
      );
      const text = textEl?.textContent?.trim() ?? null;

      const timeEl = container.querySelector("time");
      const date = timeEl?.textContent?.trim() ?? null;

      const socialBar = container.querySelector(
        ".social-details-social-counts, .feed-shared-social-counts"
      );

      let likes: number | null = null;
      let comments: number | null = null;
      let reposts: number | null = null;

      if (socialBar) {
        const reactionsEl = socialBar.querySelector(
          ".social-details-social-counts__reactions-count, " +
          "[data-test-id='social-actions__reaction-count'], " +
          "button[aria-label*='reaction'], button[aria-label*='like']"
        );
        const reactionsText =
          reactionsEl?.textContent?.trim() ??
          reactionsEl?.getAttribute("aria-label") ??
          null;
        if (reactionsText) {
          const m = reactionsText.replace(/,/g, "").match(/(\d+)/);
          likes = m ? parseInt(m[1], 10) : null;
        }

        const spans = socialBar.querySelectorAll(
          "button[aria-label], span, a"
        );
        for (const span of spans) {
          const label =
            span.getAttribute("aria-label") ??
            span.textContent ??
            "";
          const cleaned = label.toLowerCase();
          if (/comment/i.test(cleaned)) {
            const m = cleaned.replace(/,/g, "").match(/(\d+)/);
            if (m) comments = parseInt(m[1], 10);
          }
          if (/repost/i.test(cleaned)) {
            const m = cleaned.replace(/,/g, "").match(/(\d+)/);
            if (m) reposts = parseInt(m[1], 10);
          }
        }
      }

      if (text || date) {
        posts.push({ text, date, likes, comments, reposts, isRepost });
      }
    }

    return posts;
  });
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
    .replace(/<svg[\s\S]*?<\/svg>/gi, "")
    .replace(/\s(class|data-[\w-]+|aria-[\w-]+|jsaction|jscontroller|jsname)="[^"]*"/gi, "")
    .replace(/\s{2,}/g, " ");
}

export async function scrapeLinkedInProfile(
  url: string,
  options?: ScrapeLinkedInProfileOptions
): Promise<Result<LinkedInProfile>> {
  if (!url.includes("linkedin.com/in/")) {
    return {
      ok: false,
      error: "URL must be a LinkedIn profile URL (linkedin.com/in/...)",
      code: "PROFILE_NOT_FOUND",
    };
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      ok: false,
      error: "ANTHROPIC_API_KEY must be set",
      code: "MISSING_CREDENTIALS",
    };
  }

  const sessionPath = options?.sessionPath ?? ".linkedin-session.json";
  const timeout = options?.timeout ?? 30_000;

  const browserResult = await launchBrowser({
    headless: options?.headless,
    sessionPath,
  });

  if (!browserResult.ok) {
    return browserResult;
  }

  const session = browserResult.data;

  try {
    log("checking session...");
    const sessionValid = await isSessionValid(session.page);

    if (!sessionValid) {
      log("session expired, logging in...");
      const loginResult = await loginToLinkedIn(session.page);
      if (!loginResult.ok) {
        return loginResult;
      }
      await saveSession(session.context, sessionPath);
      log("logged in");
    } else {
      log("session valid");
    }

    log(`navigating to ${url}`);
    await session.page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout,
    });

    const currentUrl = session.page.url();
    if (
      currentUrl.includes("/404") ||
      currentUrl.includes("page-not-found")
    ) {
      return {
        ok: false,
        error: "LinkedIn profile not found",
        code: "PROFILE_NOT_FOUND",
      };
    }

    const pageText = await session.page.textContent("body");
    if (
      pageText?.includes("too many requests") ||
      pageText?.includes("rate limit")
    ) {
      return {
        ok: false,
        error: "LinkedIn rate limit detected",
        code: "RATE_LIMITED",
      };
    }

    log("scrolling main profile...");
    await scrollToBottom(session.page, "main profile");

    log("capturing main profile HTML...");
    const mainHtml = await session.page
      .locator("main")
      .innerHTML({ timeout: 10_000 });

    const profileBase = url.replace(/\/$/, "");
    const detailPages = [
      { url: `${profileBase}/details/experience/`, label: "experience" },
      { url: `${profileBase}/details/education/`, label: "education" },
    ];

    const detailHtmlParts: string[] = [];
    for (const detail of detailPages) {
      try {
        log(`loading ${detail.label} page...`);
        await session.page.goto(detail.url, {
          waitUntil: "domcontentloaded",
          timeout,
        });
        await scrollToBottom(session.page, detail.label);
        const html = await session.page
          .locator("main")
          .innerHTML({ timeout: 10_000 });
        detailHtmlParts.push(html);
        log(`captured ${detail.label} HTML`);
      } catch {
        log(`skipped ${detail.label} (page not found or error)`);
      }
    }

    let posts: readonly LinkedInPost[] = [];
    try {
      log("loading posts page...");
      await session.page.goto(`${profileBase}/recent-activity/all/`, {
        waitUntil: "domcontentloaded",
        timeout,
      });
      await scrollToBottom(session.page, "posts", {
        delay: 150,
        settleTime: 800,
      });
      posts = await scrapePostsFromPage(session.page);
      log(`extracted ${posts.length} posts from DOM`);
    } catch {
      log("skipped posts (page not found or error)");
    }

    const allHtml = [mainHtml, ...detailHtmlParts].join("\n");

    const cleanedHtml = stripHtml(allHtml);
    log(`total HTML size: ${cleanedHtml.length} chars`);

    await saveSession(session.context, sessionPath);

    log("sending to Claude for extraction...");
    const anthropic = new Anthropic();

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      tools: [PROFILE_TOOL_SCHEMA],
      tool_choice: { type: "tool", name: "extract_profile" },
      messages: [
        {
          role: "user",
          content: `Extract the LinkedIn profile data from this HTML. Only extract what is explicitly present — use null for missing fields. For dates, preserve the original format (e.g., "Jan 2020", "2019").

${cleanedHtml}`,
        },
      ],
    });

    const toolBlock = message.content.find(
      (block) => block.type === "tool_use"
    );

    if (!toolBlock || toolBlock.type !== "tool_use") {
      return {
        ok: false,
        error: "Claude did not return structured profile data",
        code: "PARSE_ERROR",
      };
    }

    const extracted = toolBlock.input as Record<string, unknown>;

    const profile: LinkedInProfile = {
      linkedInUrl: url,
      name: (extracted.name as string) ?? null,
      headline: (extracted.headline as string) ?? null,
      location: (extracted.location as string) ?? null,
      about: (extracted.about as string) ?? null,
      profileImageUrl: (extracted.profileImageUrl as string) ?? null,
      experiences: (extracted.experiences as LinkedInProfile["experiences"]) ?? [],
      educations: (extracted.educations as LinkedInProfile["educations"]) ?? [],
      skills: (extracted.skills as LinkedInProfile["skills"]) ?? [],
      posts,
    };

    return { ok: true, data: profile };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return { ok: false, error: message, code: "NETWORK_ERROR" };
  } finally {
    await closeBrowser(session);
  }
}
