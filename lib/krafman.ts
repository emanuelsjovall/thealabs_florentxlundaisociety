import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import type { BrowserContext, Page } from "playwright";

import type {
  KrafmanCompanyProfile,
  KrafmanResult,
  KrafmanScrapeOptions,
} from "@/lib/krafman.types";

chromium.use(StealthPlugin());

const KRAFMAN_BASE_URL = "https://krafman.se";
const BROWSER_DATA_DIR = "/tmp/krafman-browser-data";

interface BrowserSession {
  readonly context: BrowserContext;
  readonly page: Page;
}

async function launchBrowser(
  options?: KrafmanScrapeOptions,
): Promise<KrafmanResult<BrowserSession>> {
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
      'button[mode="primary"], button:has-text("GODKÄNN"), button:has-text("Acceptera"), button:has-text("Accept"), .cookie-consent button',
    );
    if ((await consentButton.count()) > 0) {
      await consentButton.first().click({ timeout: 3000 });
      await page.waitForTimeout(500);
    }
  } catch {
    // No consent dialog or already dismissed
  }
}

export async function krafmanUrl(
  url: string,
  options?: KrafmanScrapeOptions,
): Promise<KrafmanResult<KrafmanCompanyProfile>> {
  if (!url.includes("krafman.se/")) {
    return {
      ok: false,
      error: "URL must be a krafman.se URL",
      code: "INVALID_URL",
    };
  }

  const browserResult = await launchBrowser(options);
  if (!browserResult.ok) return browserResult;

  const session = browserResult.data;
  const timeout = options?.timeout ?? 30_000;

  try {
    // Load homepage first to establish cookies
    await session.page.goto(KRAFMAN_BASE_URL, {
      waitUntil: "domcontentloaded",
      timeout,
    });
    await session.page.waitForTimeout(1500);
    await dismissCookieConsent(session.page);

    // Navigate to company page
    await session.page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout,
    });
    await session.page.waitForTimeout(2000);

    const title = await session.page.title();
    if (
      title.includes("Attention Required") ||
      title.includes("blocked")
    ) {
      return {
        ok: false,
        error: "Blocked by anti-bot protection. Try again later.",
        code: "BLOCKED",
      };
    }

    const rawHtml = await session.page.evaluate(
      () => document.body.innerHTML,
    );

    const profileData = await session.page.evaluate(() => {
      const body = document.body;
      const text = body.innerText;

      // Company name from h1 (skip QR code overlays)
      let companyName = "";
      const h1Els = document.querySelectorAll("h1");
      for (let i = 0; i < h1Els.length; i++) {
        const h1Text = h1Els[i]?.textContent?.trim() || "";
        if (h1Text && !h1Text.includes("QR") && !h1Text.includes("Skanna")) {
          companyName = h1Text;
          break;
        }
      }

      // Org number - look for pattern like "Org.nr: 559521-2373"
      const orgMatch = text.match(/Org\.?\s*nr[:\s]+(\d{6}-\d{4})/i);
      const orgNumber = orgMatch ? orgMatch[1] : null;

      // Status - "Företagets status: Aktiv" or "Status: Aktiv"
      const statusMatch = text.match(
        /(?:Företagets\s+)?[Ss]tatus[:\s]+(Aktiv|Inaktiv|Avregistrerad)/i,
      );
      const status = statusMatch ? statusMatch[1] : null;

      // Registration year - "Registreringsår: 2025"
      const regYearMatch = text.match(/Registreringsår[:\s]+(\d{4})/i);
      const registrationYear = regYearMatch
        ? parseInt(regYearMatch[1], 10)
        : null;

      // Address - "Postadress: Bantorget 2, 22229, Lund"
      // Must match "Postadress:" with colon to avoid matching intro text
      const addrMatch = text.match(
        /Postadress:\s*(.+?)(?=\n)/i,
      );
      const address = addrMatch ? addrMatch[1].trim() : null;

      // Location - extract city from address (last part after postal code)
      let location: string | null = null;
      if (address) {
        const cityMatch = address.match(/\d{5}\s*,?\s*(.+)/);
        if (cityMatch) location = cityMatch[1].trim();
      }

      // Industry / SNI code - "72101 Bioteknisk forskning och utveckling"
      const sniMatch = text.match(
        /(\d{5})\s+([\wÅÄÖåäö][\wÅÄÖåäö ]+)/,
      );
      const industry = sniMatch
        ? `${sniMatch[1]} ${sniMatch[2].trim()}`
        : null;

      // Legal form - "Bolagsform: Aktiebolag"
      const legalMatch = text.match(
        /(?:Bolagsform|Juridisk form):\s*([^\n]+)/i,
      );
      const legalForm = legalMatch ? legalMatch[1].trim() : null;

      // Description - text after "Verksamhet" heading
      const descAltMatch = text.match(
        /(?:Aktiebolaget|Bolaget|Företaget)\s+ska\s+([^\n]+)/i,
      );
      const description = descAltMatch
        ? `${descAltMatch[0].trim()}`
        : null;

      // Share capital
      const shareMatch = text.match(
        /Aktiekapital\w*\s+(?:är\s+)?([0-9\s]+\s*kr)/i,
      );
      const shareCapital = shareMatch
        ? shareMatch[1].replace(/\s+/g, " ").trim()
        : null;

      // Registration flags
      const fTaxMatch = text.match(/F-skatt[:\s]+(Registrerad|Ej registrerad)/i);
      const fTax = fTaxMatch
        ? fTaxMatch[1].toLowerCase() === "registrerad"
        : null;

      const vatMatch = text.match(/Moms[:\s]+(Registrerad|Ej registrerad)/i);
      const vatRegistered = vatMatch
        ? vatMatch[1].toLowerCase() === "registrerad"
        : null;

      const employerMatch = text.match(
        /Arbetsgivare[:\s]+(Registrerad|Ej registrerad)/i,
      );
      const employerRegistered = employerMatch
        ? employerMatch[1].toLowerCase() === "registrerad"
        : null;

      // Board members - parse from the management text block
      const boardMembers: Array<{
        name: string;
        age: number | null;
        role: string;
        profileUrl: string | null;
        engagementCount: number | null;
      }> = [];

      // Extract the management section text
      const mgmtMatch = text.match(
        /Ledning, styrelse och andra befattningshavare\n([\s\S]*?)(?=\nHistorisk ledning|\nMer information|\n\n\n)/i,
      );

      if (mgmtMatch) {
        const mgmtText = mgmtMatch[1];
        const lines = mgmtText.split("\n").map((l) => l.trim()).filter(Boolean);
        const rolePattern =
          /^(Styrelseledamot|Styrelsesuppleant|Styrelseordförande|VD|Verkställande direktör|Revisor|Extern firmatecknare|Firmatecknare|Huvudansvarig revisor)/i;

        let currentRole = "";
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i] || "";
          if (rolePattern.test(line)) {
            currentRole = line;
            continue;
          }

          // Person line: "Jakob Vait Emil Gerstl 29 år"
          const personMatch = line.match(/^(.+?)\s+(\d+)\s+år$/);
          if (personMatch) {
            const personName = personMatch[1]?.trim() || "";
            const personAge = parseInt(personMatch[2] || "0", 10);

            // Next line should have engagement count
            const nextLine = lines[i + 1] || "";
            const engMatch = nextLine.match(/har\s+(\d+)\s+engagemang/);
            const engagementCount = engMatch
              ? parseInt(engMatch[1], 10)
              : null;

            // Find the matching link on the page
            const nameSlug = personName
              .toLowerCase()
              .replace(/\s+/g, "-")
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "");
            const personLink = document.querySelector(
              `a[href*="${nameSlug}"]`,
            );
            const href = personLink?.getAttribute("href") || null;

            boardMembers.push({
              name: personName,
              age: personAge || null,
              role: currentRole,
              profileUrl: href
                ? href.startsWith("http")
                  ? href
                  : `https://krafman.se${href}`
                : null,
              engagementCount,
            });

            // Skip the engagement info line
            if (engMatch) i++;
          }
        }
      }

      // Debt / Kronofogden
      let debt: {
        generalDebt: string | null;
        individualDebt: string | null;
        paymentRemarks: number | null;
        date: string | null;
      } | null = null;

      const generalDebtMatch = text.match(
        /Allmänna mål\s+totalt\s+([0-9\s]+\s*kr)/i,
      );
      const individualDebtMatch = text.match(
        /Enskilda mål\s+totalt\s+([0-9\s]+\s*kr)/i,
      );
      const remarksMatch = text.match(
        /Betalningsanmärkningar[:\s]+(\d+)/i,
      );
      const debtDateMatch = text.match(
        /Skuldsaldo\s+hos\s+Kronofogden\s+(\d{4}-\d{2}-\d{2})/i,
      );

      if (generalDebtMatch || individualDebtMatch) {
        debt = {
          generalDebt: generalDebtMatch
            ? generalDebtMatch[1].replace(/\s+/g, " ").trim()
            : null,
          individualDebt: individualDebtMatch
            ? individualDebtMatch[1].replace(/\s+/g, " ").trim()
            : null,
          paymentRemarks: remarksMatch
            ? parseInt(remarksMatch[1], 10)
            : null,
          date: debtDateMatch ? debtDateMatch[1] : null,
        };
      }

      return {
        companyName,
        orgNumber,
        status,
        registrationYear,
        address,
        location,
        industry,
        legalForm,
        description,
        shareCapital,
        fTax,
        vatRegistered,
        employerRegistered,
        boardMembers,
        debt,
      };
    });

    if (!profileData || !profileData.companyName) {
      return {
        ok: false,
        error: "Failed to extract company data from page",
        code: "PARSE_ERROR",
      };
    }

    const profile: KrafmanCompanyProfile = {
      url,
      companyName: profileData.companyName,
      orgNumber: profileData.orgNumber,
      status: profileData.status,
      registrationYear: profileData.registrationYear,
      address: profileData.address,
      location: profileData.location,
      industry: profileData.industry,
      legalForm: profileData.legalForm,
      description: profileData.description,
      shareCapital: profileData.shareCapital,
      fTax: profileData.fTax,
      vatRegistered: profileData.vatRegistered,
      employerRegistered: profileData.employerRegistered,
      boardMembers: profileData.boardMembers,
      debt: profileData.debt,
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
