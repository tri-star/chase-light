-- CreateTable
CREATE TABLE "feed_github_metas" (
    "id" UUID NOT NULL,
    "feed_id" UUID NOT NULL,
    "last_release_date" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "feed_github_metas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "feed_github_metas_feed_id_key" ON "feed_github_metas"("feed_id");

-- AddForeignKey
ALTER TABLE "feed_github_metas" ADD CONSTRAINT "feed_github_metas_feed_id_fkey" FOREIGN KEY ("feed_id") REFERENCES "feeds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
