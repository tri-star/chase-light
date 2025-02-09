-- CreateTable
CREATE TABLE "feed_log_items" (
    "id" UUID NOT NULL,
    "feed_log_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "summary" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feed_log_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "feed_log_items_feed_log_id_idx" ON "feed_log_items"("feed_log_id");

-- AddForeignKey
ALTER TABLE "feed_log_items" ADD CONSTRAINT "feed_log_items_feed_log_id_fkey" FOREIGN KEY ("feed_log_id") REFERENCES "feed_logs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
