-- AlterTable
ALTER TABLE "users" ADD COLUMN     "strava_athlete_id" TEXT,
ADD COLUMN     "strava_fetched_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "strava_activities" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "strava_activity_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sport_type" TEXT NOT NULL,
    "datetime" TIMESTAMP(3) NOT NULL,
    "distance_meters" DOUBLE PRECISION,
    "moving_time_seconds" INTEGER,
    "elapsed_time_seconds" INTEGER,
    "elevation_meters" DOUBLE PRECISION,
    "calories" INTEGER,
    "pace" TEXT,
    "location" TEXT,
    "kudos_count" INTEGER NOT NULL DEFAULT 0,
    "comments_count" INTEGER NOT NULL DEFAULT 0,
    "achievements" JSONB,
    "description" TEXT,
    "has_map" BOOLEAN NOT NULL DEFAULT false,
    "map_url" TEXT,
    "activity_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "strava_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "strava_activities_strava_activity_id_key" ON "strava_activities"("strava_activity_id");

-- CreateIndex
CREATE INDEX "strava_activities_user_id_datetime_idx" ON "strava_activities"("user_id", "datetime" DESC);

-- AddForeignKey
ALTER TABLE "strava_activities" ADD CONSTRAINT "strava_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
