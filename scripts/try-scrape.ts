import { scrapeTwitter } from "../lib/scrape-twitter"

const username = process.argv[2]
const limit = process.argv[3] ? parseInt(process.argv[3], 10) : 10

if (!username) {
  console.error("Usage: pnpm scrape <username> [limit]")
  console.error("Example: pnpm scrape elonmusk 5")
  process.exit(1)
}

console.log(`Scraping @${username} (limit: ${limit})...\n`)

const result = await scrapeTwitter(username, limit)

console.log(`Scraped ${result.tweetCount} tweets for @${result.username}`)
console.log(`Scraped at: ${result.scrapedAt}\n`)

for (const tweet of result.tweets) {
  console.log(`--- [${tweet.kind}] ${tweet.tweetId} ---`)
  console.log(`@${tweet.user} | ${tweet.createdAt}`)
  console.log(tweet.postText.slice(0, 200))
  console.log(
    `Likes: ${tweet.metrics.likeCount} | RT: ${tweet.metrics.retweetCount} | Views: ${tweet.metrics.viewCount} | Mutual: ${tweet.isMutualFollowership}`
  )
  if (tweet.originalTweet) {
    console.log(`  -> Original by @${tweet.originalTweet.user}: ${tweet.originalTweet.text?.slice(0, 100)}`)
  }
  console.log()
}
