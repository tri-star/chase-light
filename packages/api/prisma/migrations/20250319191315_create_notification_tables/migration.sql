/*
  Warnings:

  - You are about to drop the column `feedLogId` on the `notification_items` table. All the data in the column will be lost.
  - You are about to drop the column `notificationId` on the `notification_items` table. All the data in the column will be lost.
  - Added the required column `feed_log_id` to the `notification_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `notification_id` to the `notification_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `notification_items` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "notification_items" DROP CONSTRAINT "notification_items_notificationId_fkey";

-- AlterTable
ALTER TABLE "notification_items" DROP COLUMN "feedLogId",
DROP COLUMN "notificationId",
ADD COLUMN     "feed_log_id" UUID NOT NULL,
ADD COLUMN     "notification_id" UUID NOT NULL,
ADD COLUMN     "title" VARCHAR(255) NOT NULL;

-- AddForeignKey
ALTER TABLE "notification_items" ADD CONSTRAINT "notification_items_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
