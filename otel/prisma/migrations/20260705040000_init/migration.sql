-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "CompetitorSource" AS ENUM ('manual', 'demo', 'ets_placeholder');

-- CreateEnum
CREATE TYPE "ObservationStatus" AS ENUM ('success', 'unavailable', 'blocked', 'error');

-- CreateEnum
CREATE TYPE "ScrapeRunStatus" AS ENUM ('running', 'completed', 'partial', 'blocked', 'failed');

-- CreateTable
CREATE TABLE "competitors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "source" "CompetitorSource" NOT NULL DEFAULT 'demo',
    "public_url" TEXT,
    "price_selector" TEXT,
    "room_selector" TEXT,
    "board_selector" TEXT,
    "cancellation_selector" TEXT,
    "availability_selector" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competitors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_profiles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "check_in" DATE NOT NULL,
    "nights" INTEGER NOT NULL,
    "adults" INTEGER NOT NULL,
    "children" INTEGER NOT NULL DEFAULT 0,
    "board_preference" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "search_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competitor_profiles" (
    "competitor_id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "competitor_profiles_pkey" PRIMARY KEY ("competitor_id","profile_id")
);

-- CreateTable
CREATE TABLE "price_observations" (
    "id" TEXT NOT NULL,
    "competitor_id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "scrape_run_id" TEXT,
    "source" "CompetitorSource" NOT NULL,
    "source_url" TEXT,
    "room_name" TEXT,
    "board_type" TEXT,
    "cancellation_policy" TEXT,
    "availability_text" TEXT,
    "price_amount" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "check_in" DATE NOT NULL,
    "check_out" DATE NOT NULL,
    "adults" INTEGER NOT NULL,
    "children" INTEGER NOT NULL DEFAULT 0,
    "observed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "raw_snapshot_text" TEXT,
    "status" "ObservationStatus" NOT NULL,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_observations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "own_hotel_prices" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "price_amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "own_hotel_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scrape_runs" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT,
    "source" "CompetitorSource" NOT NULL,
    "status" "ScrapeRunStatus" NOT NULL DEFAULT 'running',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    "requested" INTEGER NOT NULL DEFAULT 0,
    "succeeded" INTEGER NOT NULL DEFAULT 0,
    "blocked" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scrape_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "competitors_active_source_idx" ON "competitors"("active", "source");

-- CreateIndex
CREATE INDEX "price_observations_competitor_id_profile_id_observed_at_idx" ON "price_observations"("competitor_id", "profile_id", "observed_at");

-- CreateIndex
CREATE INDEX "price_observations_check_in_status_idx" ON "price_observations"("check_in", "status");

-- CreateIndex
CREATE UNIQUE INDEX "own_hotel_prices_profile_id_date_key" ON "own_hotel_prices"("profile_id", "date");

-- CreateIndex
CREATE INDEX "scrape_runs_started_at_idx" ON "scrape_runs"("started_at");

-- CreateIndex
CREATE UNIQUE INDEX "app_settings_key_key" ON "app_settings"("key");

-- AddForeignKey
ALTER TABLE "competitor_profiles" ADD CONSTRAINT "competitor_profiles_competitor_id_fkey" FOREIGN KEY ("competitor_id") REFERENCES "competitors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competitor_profiles" ADD CONSTRAINT "competitor_profiles_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "search_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_observations" ADD CONSTRAINT "price_observations_competitor_id_fkey" FOREIGN KEY ("competitor_id") REFERENCES "competitors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_observations" ADD CONSTRAINT "price_observations_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "search_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_observations" ADD CONSTRAINT "price_observations_scrape_run_id_fkey" FOREIGN KEY ("scrape_run_id") REFERENCES "scrape_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "own_hotel_prices" ADD CONSTRAINT "own_hotel_prices_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "search_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scrape_runs" ADD CONSTRAINT "scrape_runs_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "search_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
