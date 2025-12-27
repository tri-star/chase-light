DROP INDEX "idx_activities_body_translation_requested_at";--> statement-breakpoint
ALTER TABLE "activities" ALTER COLUMN "body_translation_status" SET DEFAULT 'idle';--> statement-breakpoint
UPDATE "activities" SET "body_translation_status" = 'idle' WHERE "translated_body" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_activities_body_translation_requested_at" ON "activities" USING btree ("body_translation_requested_at" DESC);