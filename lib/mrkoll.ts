import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import type { BrowserContext, Page } from "playwright";

import type {
  MrkollCompanyEngagement,
  MrkollResult,
  MrkollSearchResult,
  MrkollProfile,
  MrkollScrapeOptions,
} from "@/lib/mrkoll.types";

chromium.use(StealthPlugin());

const MRKOLL_BASE_URL = "https://mrkoll.se";
const BROWSER_DATA_DIR = "/tmp/mrkoll-browser-data";

interface BrowserSession {
  readonly context: BrowserContext;
  readonly page: Page;
}

async function launchBrowser(
  options?: MrkollScrapeOptions,
): Promise<MrkollResult<BrowserSession>> {
  const headless = options?.headless ?? false;

  try {
    const context = await chromium.launchPersistentContext(BROWSER_DATA_DIR, {
      headless,
      channel: "chrome",
      viewport: { width: 1280, height: 800 },
    });

    const page = context.pages()[0] ?? (await context.newPage());

    return { ok: true, data: { context, page } };
  } catch {
    return {
      ok: false,
      error: "Failed to launch browser",
      code: "BROWSER_ERROR",
    };
  }
}

async function closeBrowser(session: BrowserSession): Promise<void> {
  await session.context.close();
}

async function dismissCookieConsent(page: Page): Promise<void> {
  try {
    const consentButton = page.locator(
      'button[mode="primary"], button:has-text("GODKÄNN"), button:has-text("Acceptera"), button:has-text("Accept")',
    );
    if ((await consentButton.count()) > 0) {
      await consentButton.first().click({ timeout: 3000 });
      await page.waitForTimeout(500);
    }
  } catch {
    // No consent dialog or already dismissed
  }
}

function isBlocked(title: string): boolean {
  return (
    title.includes("Attention Required") || title.includes("blocked")
  );
}

export async function mrkoll(
  name: string,
  location: string,
  options?: MrkollScrapeOptions,
): Promise<MrkollResult<readonly MrkollSearchResult[]>> {
  const browserResult = await launchBrowser(options);
  if (!browserResult.ok) return browserResult;

  const session = browserResult.data;
  const timeout = options?.timeout ?? 30_000;

  try {
    // Navigate to homepage
    await session.page.goto(MRKOLL_BASE_URL, {
      waitUntil: "domcontentloaded",
      timeout,
    });
    await session.page.waitForTimeout(2000);

    // Dismiss cookie consent if present
    await dismissCookieConsent(session.page);

    // Fill search form with human-like typing
    await session.page.locator("#inpField10").click();
    await session.page.waitForTimeout(200);
    await session.page.keyboard.type(name, { delay: 80 });
    await session.page.waitForTimeout(300);

    await session.page.locator("#inpField20").click();
    await session.page.waitForTimeout(200);
    await session.page.keyboard.type(location, { delay: 80 });
    await session.page.waitForTimeout(500);

    // Submit form
    await session.page.keyboard.press("Enter");

    // Wait for results page
    try {
      await session.page.waitForURL((url) => url.href.includes("/resultat"), {
        timeout: 15_000,
      });
    } catch {
      // May already be on the results page
    }
    await session.page.waitForTimeout(2000);

    // Check for Cloudflare block
    const title = await session.page.title();
    if (isBlocked(title)) {
      return {
        ok: false,
        error: "Blocked by Cloudflare. Try again later.",
        code: "BLOCKED",
      };
    }

    // Extract search results
    const results = await session.page.evaluate((baseUrl: string) => {
      const entries: Array<{
        name: string;
        age: number | null;
        address: string | null;
        personnummer: string | null;
        extraInfo: string[];
        profileUrl: string;
      }> = [];

      const links = document.querySelectorAll(
        '.resultC2 > a[href*="/person/"]',
      );

      for (const link of links) {
        const href = link.getAttribute("href");
        if (!href || href.includes("/person/nya-grannar/")) continue;

        const header = link.querySelector(".resBlockHeader_result");
        if (!header) continue;

        // Extract full name from text content
        const nameSpans = header.querySelectorAll(".namnSpan");
        const lastNameEl = header.querySelector(
          ":scope > strong",
        );
        const nameParts: string[] = [];
        for (const span of nameSpans) {
          const text = span.textContent?.trim();
          if (text) nameParts.push(text);
        }
        if (lastNameEl) {
          nameParts.push(lastNameEl.textContent?.trim() || "");
        }
        const fullName = nameParts.join(" ").replace(/\s+/g, " ").trim();

        // Extract age
        const ageEl = header.querySelector(".distance");
        const ageText = ageEl?.textContent?.trim() || "";
        const ageMatch = ageText.match(/(\d+)\s*år/);
        const age = ageMatch ? parseInt(ageMatch[1], 10) : null;

        // Extract address
        const addrEl = header.querySelector(".stText");
        const address = addrEl?.textContent?.trim().replace(/\s+/g, " ") || null;

        // Extract personnummer
        const pnrEl = link.querySelector(".persnrDesktop");
        const personnummer = pnrEl?.textContent?.trim() || null;

        // Extract extra info
        const infoEls = link.querySelectorAll(".infoSpan");
        const extraInfo: string[] = [];
        for (const info of infoEls) {
          const text = info.textContent?.trim().replace(/^[•\s]+/, "");
          if (text) extraInfo.push(text);
        }

        entries.push({
          name: fullName,
          age,
          address,
          personnummer,
          extraInfo,
          profileUrl: `${baseUrl}${href}`,
        });
      }

      return entries;
    }, MRKOLL_BASE_URL);

    if (results.length === 0) {
      return {
        ok: false,
        error: `No results found for "${name}" in "${location}"`,
        code: "NO_RESULTS",
      };
    }

    return { ok: true, data: results };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { ok: false, error: message, code: "NETWORK_ERROR" };
  } finally {
    await closeBrowser(session);
  }
}

export async function mrkollUrl(
  url: string,
  options?: MrkollScrapeOptions,
): Promise<MrkollResult<MrkollProfile>> {
  if (!url.includes("mrkoll.se/")) {
    return {
      ok: false,
      error: "URL must be a mrkoll.se URL",
      code: "INVALID_URL",
    };
  }

  const browserResult = await launchBrowser(options);
  if (!browserResult.ok) return browserResult;

  const session = browserResult.data;
  const timeout = options?.timeout ?? 30_000;

  try {
    // Load homepage first to get Cloudflare cookies
    await session.page.goto(MRKOLL_BASE_URL, {
      waitUntil: "domcontentloaded",
      timeout,
    });
    await session.page.waitForTimeout(1500);
    await dismissCookieConsent(session.page);

    // Navigate to profile page
    await session.page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout,
    });
    await session.page.waitForTimeout(2000);

    // Check for Cloudflare block
    const title = await session.page.title();
    if (isBlocked(title)) {
      return {
        ok: false,
        error: "Blocked by Cloudflare. Try again later.",
        code: "BLOCKED",
      };
    }

    // Get raw HTML for fallback parsing
    const rawHtml = await session.page.evaluate(
      () => document.querySelector("#mainContent")?.innerHTML || "",
    );

    // Extract profile data using discovered selectors
    const profileData = await session.page.evaluate(() => {
      const main = document.querySelector("#mainContent");
      if (!main) return null;

      // Full name from .name_head1 spans (tilltalsnamn, förnamn, mellannamn, efternamn)
      const nameContainer = main.querySelector(".name_head1 .f_line1");
      let name = "";
      if (nameContainer) {
        const spans = nameContainer.querySelectorAll("span[title]");
        const parts: string[] = [];
        for (const span of spans) {
          const text = span.textContent?.trim();
          if (text) parts.push(text);
        }
        name = parts.join(" ").replace(/\s+/g, " ").trim();
      }
      // Fallback to h1
      if (!name) {
        name =
          main.querySelector("h1.infoH1person")?.textContent?.trim() || "";
      }

      // Age from h2 subtitle "87-årig herre i Stockholm"
      const h2 = main.querySelector("h2.infoH2person");
      const h2Text = h2?.textContent?.trim() || "";
      const ageMatch = h2Text.match(/(\d+)-årig/);
      const age = ageMatch ? parseInt(ageMatch[1], 10) : null;

      // Address from .f_line2.pl65 elements
      const addrEls = main.querySelectorAll(".f_line2.pl65");
      const addrParts: string[] = [];
      for (const el of addrEls) {
        const text = el.textContent?.trim();
        if (text) addrParts.push(text);
      }
      const address = addrParts.join(", ") || null;

      // Location (kommun) from col_block1 with "Kommun" header
      let location: string | null = null;
      const colBlocks = main.querySelectorAll(".col_block1");
      for (const block of colBlocks) {
        const header = block.querySelector(".f_head1");
        if (header?.textContent?.trim() === "Kommun") {
          location = block.querySelector(".f_line2")?.textContent?.trim() || null;
        }
      }

      // Personnummer from col_block1 with "Personnummer" header
      let personnummer: string | null = null;
      for (const block of colBlocks) {
        const header = block.querySelector(".f_head1");
        if (header?.textContent?.trim() === "Personnummer") {
          personnummer =
            block.querySelector(".f_line2")?.textContent?.trim().replace(/\s+/g, "") || null;
        }
      }

      // Phone numbers from .phone_div a[href^="tel:"] span.phone
      const phoneEls = main.querySelectorAll('.phone_div a[href^="tel:"] span.phone');
      const phoneNumbers: string[] = [];
      for (const el of phoneEls) {
        const text = el.textContent?.trim();
        if (text) phoneNumbers.push(text);
      }

      // Company engagements from the "Bolagsengagemang" section
      const companies: Array<{
        companyName: string;
        roles: string[];
        registrationYear: number | null;
        orgNumber: string | null;
        krafmanUrl: string | null;
      }> = [];
      const companyBlocks = main.querySelectorAll(".resBlock");
      for (const block of companyBlocks) {
        const header = block.querySelector(".f_line1");
        if (!header?.textContent?.includes("Bolagsengagemang")) continue;

        const entries = block.querySelectorAll("p.f_line5");
        for (const entry of entries) {
          const companyName =
            entry.querySelector("strong")?.textContent?.trim() || "";
          const orgNumber =
            entry
              .querySelector('span[style*="float"]')
              ?.textContent?.trim() || null;
          const krafmanLink = entry.querySelector('a[href*="krafman"]');
          const krafmanUrl = krafmanLink?.getAttribute("href") || null;

          // Parse roles and registration year from .bxtra text
          const bxtra =
            entry.querySelector(".bxtra")?.textContent?.trim() || "";
          const yearMatch = bxtra.match(/registrerat\s+(\d{4})/);
          const registrationYear = yearMatch
            ? parseInt(yearMatch[1], 10)
            : null;

          // Extract roles: everything after "registrerat YYYY, " and before "Mer info"
          const rolesText = bxtra
            .replace(/registrerat\s+\d{4},?\s*/, "")
            .replace(/Mer info.*$/, "")
            .trim();
          const roles = rolesText
            ? rolesText.split(",").map((r) => r.trim()).filter(Boolean)
            : [];

          if (companyName) {
            companies.push({
              companyName,
              roles,
              registrationYear,
              orgNumber,
              krafmanUrl,
            });
          }
        }
        break;
      }

      // Household members from the section after "Hushållet" header
      const household: Array<{
        name: string;
        age: number | null;
        profileUrl: string | null;
      }> = [];

      // Find the household paragraph (personInfo after "Hushållet" header)
      const householdHeaders = main.querySelectorAll(".gr_inlineHeader");
      for (const header of householdHeaders) {
        if (header.textContent?.trim() === "Hushållet") {
          // Get the next sibling paragraph
          let sibling = header.nextElementSibling;
          while (sibling) {
            if (sibling.classList.contains("gr_inlineHeader")) break;
            const links = sibling.querySelectorAll('a[href*="/person/"]');
            for (const link of links) {
              const text = link.textContent?.trim() || "";
              const href = link.getAttribute("href");
              const memberAgeMatch = text.match(/(\d+)\s*år/);
              household.push({
                name: text.replace(/\d+\s*år.*$/, "").trim(),
                age: memberAgeMatch ? parseInt(memberAgeMatch[1], 10) : null,
                profileUrl: href ? `https://mrkoll.se${href}` : null,
              });
            }
            sibling = sibling.nextElementSibling;
          }
          break;
        }
      }

      // Neighbors from .grannHeader4 links in .vplan sections
      const neighbors: Array<{
        name: string;
        address: string | null;
        profileUrl: string | null;
      }> = [];
      const neighborEls = main.querySelectorAll(".vplan a .grannHeader4");
      for (const el of neighborEls) {
        const nameEl = el.querySelector("strong");
        const neighborName = nameEl?.textContent?.trim() || "";
        const href = el.closest("a")?.getAttribute("href");
        const moveInfo = el.querySelector(".flyttclass")?.textContent?.trim() || null;
        // Extract age from the text "Name, XX år"
        const fullText = el.textContent?.trim() || "";
        const nAgeMatch = fullText.match(/(\d+)\s*år/);

        neighbors.push({
          name: `${neighborName}${nAgeMatch ? `, ${nAgeMatch[1]} år` : ""}${moveInfo ? ` (${moveInfo})` : ""}`,
          address: null,
          profileUrl: href ? `https://mrkoll.se${href}` : null,
        });
      }

      // Property info from .bo_block
      const boBlock = main.querySelector(".bo_block");
      const propertyInfo = boBlock?.textContent?.trim().replace(/\s+/g, " ") || null;

      return {
        name,
        age,
        address,
        location,
        personnummer,
        phoneNumbers,
        companies,
        household,
        propertyInfo,
        neighbors,
      };
    });

    if (!profileData || !profileData.name) {
      return {
        ok: false,
        error: "Failed to extract profile data from page",
        code: "PARSE_ERROR",
      };
    }

    const profile: MrkollProfile = {
      url,
      name: profileData.name,
      age: profileData.age,
      address: profileData.address,
      location: profileData.location,
      personnummer: profileData.personnummer,
      phoneNumbers: profileData.phoneNumbers,
      companies: profileData.companies,
      household: profileData.household,
      propertyInfo: profileData.propertyInfo,
      neighbors: profileData.neighbors,
      rawHtml,
    };

    return { ok: true, data: profile };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { ok: false, error: message, code: "NETWORK_ERROR" };
  } finally {
    await closeBrowser(session);
  }
}
