/*
  Warnings:

  - You are about to drop the column `body` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `notifications` table. All the data in the column will be lost.
  - Added the required column `read` to the `notifications` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "notifications" DROP COLUMN "body",
DROP COLUMN "updated_at",
ADD COLUMN     "read" BOOLEAN NOT NULL;

-- CreateTable
CREATE TABLE "notification_items" (
    "id" UUID NOT NULL,
    "feedLogId" UUID NOT NULL,
    "notificationId" UUID NOT NULL,

    CONSTRAINT "notification_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- AddForeignKey
ALTER TABLE "notification_items" ADD CONSTRAINT "notification_items_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "notifications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
