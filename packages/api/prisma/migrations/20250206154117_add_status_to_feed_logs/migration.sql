-- CreateEnum
CREATE TYPE "FeedLogStatus" AS ENUM ('wait', 'in_progress', 'error', 'failed', 'done');

-- AlterTable
ALTER TABLE "feed_logs" ADD COLUMN     "status" "FeedLogStatus" NOT NULL DEFAULT 'wait';
