# Thea

## Problem

Staying genuinely informed about the people in your network — colleagues, partners, candidates, investors — takes an enormous amount of time. Scrolling LinkedIn, Twitter, Strava, and GitHub every morning to see what someone is up to can easily consume 8+ hours a day, and even then you only get a shallow, fragmented picture.

For founders making a critical early hire, the stakes are even higher. You need to understand not just what someone does on paper, but what they actually care about, what they are working on, and how to approach them — information that is spread across a dozen platforms and hard to synthesise quickly.

## Solution

Thea is an intelligence tool that keeps you informed about the people that matter to you, without the scrolling.

Thea sends out agents that crawl the internet, gathering public information across LinkedIn, X (Twitter), Strava, GitHub, and more. It aggregates everything into a single profile per person, displayed on an interactive graph and timeline. You can then ask Thea natural-language questions about anyone in your network:

- *What has this person been up to lately?*
- *What do they care about and how should I approach them?*
- *What are their strengths — are they the right fit for this role?*

## Technical Approach

- **Next.js 15 (App Router)** — full-stack React framework with server and client components
- **Prisma + PostgreSQL** — stores user records, scraped profiles, and notes
- **Agent scraping layer** — server-side scripts and API routes that pull data from LinkedIn, Strava, X, GitHub, Krafman, and breach databases
- **Graph view** — interactive node graph showing a person's connected data sources at a glance
- **Timeline view** — chronological canvas rendering all activity (jobs, education, posts, runs, tweets) with intelligent clustering to prevent overlap at any zoom level
- **AI chat (Claude)** — ask anything about a loaded profile; answers are grounded in the aggregated data
- **Detail panel** — click any node or timeline event to see the full detail, including Strava activity maps, LinkedIn post engagement, tweet metrics, and more

## How to Run

**Prerequisites:** Node.js 20+, Docker, `.env.local` with the required API keys.

```bash
# Start the database
docker compose up -d

# Install dependencies
npm install

# Push the database schema
npm run db:push

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Other useful commands:**

```bash
npm run build        # production build
npm run typecheck    # TypeScript type checking
npm run db:studio    # browse the database via Prisma Studio
npm run db:dump      # export the database to a local file
npm run db:load      # import a database dump
```
