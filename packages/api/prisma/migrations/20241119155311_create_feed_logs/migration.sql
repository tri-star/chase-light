-- CreateTable
CREATE TABLE "feed_logs" (
    "id" UUID NOT NULL,
    "feed_id" UUID NOT NULL,
    "date" TIMESTAMPTZ NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "summary" TEXT NOT NULL,
    "body" TEXT,
    "url" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "feed_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "feed_logs_feed_id_idx" ON "feed_logs"("feed_id");

-- CreateIndex
CREATE INDEX "feed_logs_date_idx" ON "feed_logs"("date");

-- CreateIndex
CREATE INDEX "feed_logs_created_at_idx" ON "feed_logs"("created_at");

-- CreateIndex
CREATE INDEX "feed_logs_updated_at_idx" ON "feed_logs"("updated_at");

-- AddForeignKey
ALTER TABLE "feed_logs" ADD CONSTRAINT "feed_logs_feed_id_fkey" FOREIGN KEY ("feed_id") REFERENCES "feeds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
