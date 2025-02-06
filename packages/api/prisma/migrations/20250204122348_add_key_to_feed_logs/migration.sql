/*
  Warnings:

  - Added the required column `key` to the `feed_logs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "feed_logs" ADD COLUMN     "key" VARCHAR(50) NOT NULL;

-- CreateIndex
CREATE INDEX "feed_logs_key_idx" ON "feed_logs"("key");
