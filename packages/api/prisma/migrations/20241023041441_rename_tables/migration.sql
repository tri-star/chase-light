/*
  Warnings:

  - You are about to drop the `Feed` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Notification` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
ALTER TABLE "User" RENAME TO "users";

ALTER TABLE "users" RENAME COLUMN "loginId" TO "login_id";
ALTER TABLE "users" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "users" RENAME COLUMN "updatedAt" TO "updated_at";


ALTER TABLE "Notification" RENAME TO "notifications";

ALTER TABLE "notifications" RENAME COLUMN "userId" TO "user_id";
ALTER TABLE "notifications" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "notifications" RENAME COLUMN "updatedAt" TO "updated_at";

ALTER TABLE "Feed" RENAME TO "feeds";

ALTER TABLE "feeds" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "feeds" RENAME COLUMN "updatedAt" TO "updated_at";
