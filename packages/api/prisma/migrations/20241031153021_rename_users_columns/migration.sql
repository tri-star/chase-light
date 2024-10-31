/*
  Warnings:

  - You are about to drop the column `login_id` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[account_name]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `account_name` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `display_name` to the `users` table without a default value. This is not possible if the table is not empty.

*/

ALTER TABLE "users" RENAME COLUMN "name" TO "display_name";
ALTER TABLE "users" RENAME COLUMN "login_id" TO "account_name";

ALTER INDEX "users_name_idx" RENAME TO "users_display_name_idx";
ALTER INDEX "users_login_id_key" RENAME TO "users_account_name_key";

