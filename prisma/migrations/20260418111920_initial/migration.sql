-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalized_name" TEXT NOT NULL,
    "linkedin_url" TEXT,
    "linkedin" JSONB,
    "twitter" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "linkedin_searches" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "result" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "linkedin_searches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_normalized_name_key" ON "users"("normalized_name");

-- CreateIndex
CREATE UNIQUE INDEX "users_linkedin_url_key" ON "users"("linkedin_url");

-- CreateIndex
CREATE UNIQUE INDEX "linkedin_searches_query_key" ON "linkedin_searches"("query");
