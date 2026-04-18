/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [
    "playwright-extra",
    "puppeteer-extra-plugin-stealth",
  ],
}

export default nextConfig
