/*
  Warnings:

  - You are about to drop the column `datetime` on the `strava_activities` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "strava_activities_user_id_datetime_idx";

-- AlterTable
ALTER TABLE "strava_activities" DROP COLUMN "datetime";

-- CreateIndex
CREATE INDEX "strava_activities_user_id_created_at_idx" ON "strava_activities"("user_id", "created_at" DESC);
