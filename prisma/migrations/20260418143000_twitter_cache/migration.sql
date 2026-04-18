-- Alter users to track cached X metadata
ALTER TABLE "users"
ADD COLUMN "twitter_username" TEXT,
ADD COLUMN "twitter_user_id" TEXT,
ADD COLUMN "twitter_fetched_at" TIMESTAMP(3);

-- Cache recent tweets per user
CREATE TABLE "twitter_tweets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "twitter_tweet_id" TEXT NOT NULL,
    "twitter_author_id" TEXT,
    "text" TEXT NOT NULL,
    "posted_at" TIMESTAMP(3) NOT NULL,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "retweets" INTEGER NOT NULL DEFAULT 0,
    "replies" INTEGER NOT NULL DEFAULT 0,
    "views" INTEGER NOT NULL DEFAULT 0,
    "is_retweet" BOOLEAN NOT NULL DEFAULT false,
    "is_reply" BOOLEAN NOT NULL DEFAULT false,
    "raw" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "twitter_tweets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "twitter_tweets_twitter_tweet_id_key" ON "twitter_tweets"("twitter_tweet_id");
CREATE INDEX "twitter_tweets_user_id_posted_at_idx" ON "twitter_tweets"("user_id", "posted_at" DESC);

ALTER TABLE "twitter_tweets"
ADD CONSTRAINT "twitter_tweets_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
