import Anthropic from "@anthropic-ai/sdk";

import type {
  LinkedInSearchResult,
  Result,
} from "@/lib/linkedin/linkedin-profile.types";
import {
  closeBrowser,
  isSessionValid,
  launchBrowser,
  loginToLinkedIn,
  saveSession,
} from "@/lib/linkedin/linkedin-auth";

const SEARCH_TOOL_SCHEMA = {
  name: "extract_search_results",
  description: "Extract LinkedIn people search results from HTML",
  input_schema: {
    type: "object" as const,
    properties: {
      results: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            name: { type: "string" as const },
            headline: { type: ["string", "null"] as const },
            profileUrl: {
              type: "string" as const,
              description:
                "The LinkedIn profile URL, e.g. https://www.linkedin.com/in/username",
            },
            connectionDegree: { type: ["string", "null"] as const },
            profileImageUrl: {
              type: ["string", "null"] as const,
              description:
                "The profile photo URL from the img tag src attribute. Must be a full https:// URL.",
            },
          },
          required: [
            "name",
            "headline",
            "profileUrl",
            "connectionDegree",
            "profileImageUrl",
          ],
        },
      },
    },
    required: ["results"],
  },
};

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
    .replace(/<svg[\s\S]*?<\/svg>/gi, "")
    .replace(
      /\s(class|data-[\w-]+|aria-[\w-]+|jsaction|jscontroller|jsname)="[^"]*"/gi,
      ""
    )
    .replace(/\s{2,}/g, " ");
}

export async function searchLinkedInProfiles(
  name: string,
  options?: {
    readonly headless?: boolean;
    readonly sessionPath?: string;
  }
): Promise<Result<readonly LinkedInSearchResult[]>> {
  if (!name.trim()) {
    return { ok: false, error: "Name is required", code: "PARSE_ERROR" };
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      ok: false,
      error: "ANTHROPIC_API_KEY must be set",
      code: "MISSING_CREDENTIALS",
    };
  }

  const sessionPath = options?.sessionPath ?? ".linkedin-session.json";

  const browserResult = await launchBrowser({
    headless: options?.headless ?? true,
    sessionPath,
  });

  if (!browserResult.ok) {
    return browserResult;
  }

  const session = browserResult.data;

  try {
    console.log("[search] checking session...");
    const sessionValid = await isSessionValid(session.page);

    if (!sessionValid) {
      console.log("[search] session expired, logging in...");
      const loginResult = await loginToLinkedIn(session.page);
      if (!loginResult.ok) {
        return loginResult;
      }
      await saveSession(session.context, sessionPath);
      console.log("[search] logged in");
    } else {
      console.log("[search] session valid");
    }

    const searchUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(name)}`;
    console.log(`[search] navigating to search: ${searchUrl}`);
    await session.page.goto(searchUrl, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });

    // Wait for results to load
    await session.page.waitForTimeout(3_000);

    // Scroll a bit to ensure results are loaded
    await session.page.evaluate(async () => {
      for (let y = 0; y < 2000; y += 400) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 300));
      }
    });
    await session.page.waitForTimeout(1_000);

    console.log("[search] capturing search results HTML...");
    const mainHtml = await session.page
      .locator("main")
      .innerHTML({ timeout: 10_000 });

    const cleanedHtml = stripHtml(mainHtml);
    console.log(`[search] HTML size: ${cleanedHtml.length} chars`);

    await saveSession(session.context, sessionPath);

    console.log("[search] sending to Claude for extraction...");
    const anthropic = new Anthropic();

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      tools: [SEARCH_TOOL_SCHEMA],
      tool_choice: { type: "tool", name: "extract_search_results" },
      messages: [
        {
          role: "user",
          content: `Extract all people search results from this LinkedIn search results HTML. For each person, extract their name, headline, profile URL (must be a full linkedin.com/in/ URL), and connection degree (e.g. "1st", "2nd", "3rd"). Only extract what is explicitly present.\n\n${cleanedHtml}`,
        },
      ],
    });

    const toolBlock = message.content.find(
      (block) => block.type === "tool_use"
    );

    if (!toolBlock || toolBlock.type !== "tool_use") {
      return {
        ok: false,
        error: "Claude did not return search results",
        code: "PARSE_ERROR",
      };
    }

    const extracted = toolBlock.input as {
      results: LinkedInSearchResult[];
    };

    console.log(`[search] found ${extracted.results.length} results`);
    return { ok: true, data: extracted.results };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return { ok: false, error: msg, code: "NETWORK_ERROR" };
  } finally {
    await closeBrowser(session);
  }
}
