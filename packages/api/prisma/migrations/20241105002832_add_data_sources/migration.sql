/*
  Warnings:

  - Added the required column `data_source_id` to the `feeds` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `feeds` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "feeds" ADD COLUMN     "cycle" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "data_source_id" UUID NOT NULL,
ADD COLUMN     "user_id" UUID NOT NULL;

-- CreateTable
CREATE TABLE "data_sources" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "url" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "data_sources_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "feeds" ADD CONSTRAINT "feeds_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feeds" ADD CONSTRAINT "feeds_data_source_id_fkey" FOREIGN KEY ("data_source_id") REFERENCES "data_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
