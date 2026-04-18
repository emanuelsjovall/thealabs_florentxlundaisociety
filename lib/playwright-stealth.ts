import { chromium } from "playwright-extra";

declare global {
  var __theaStealthPluginPromise: Promise<void> | undefined;
}

export { chromium };

export async function ensureStealthPlugin(): Promise<void> {
  if (!globalThis.__theaStealthPluginPromise) {
    globalThis.__theaStealthPluginPromise = (async () => {
      const stealthModule = await import("puppeteer-extra-plugin-stealth");
      const StealthPlugin = stealthModule.default;
      chromium.use(StealthPlugin());
    })();
  }

  await globalThis.__theaStealthPluginPromise;
}
