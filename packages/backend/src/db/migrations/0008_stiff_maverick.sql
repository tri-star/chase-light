ALTER TABLE "notifications" ALTER COLUMN "notification_type" SET DEFAULT 'activity_digest';--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "scheduled_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "status_detail" text;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "digest_delivery_times" jsonb DEFAULT '["18:00"]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "digest_timezone" text;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "digest_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
UPDATE "notifications" SET "scheduled_at" = COALESCE("sent_at", "created_at", now());--> statement-breakpoint
UPDATE "user_preferences" SET "digest_enabled" = true, "digest_delivery_times" = '["18:00"]'::jsonb, "digest_timezone" = COALESCE("timezone", 'Asia/Tokyo');--> statement-breakpoint
CREATE INDEX "idx_notifications_scheduled_at" ON "notifications" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "idx_notifications_status" ON "notifications" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "notifications_user_activity_unique" ON "notifications" USING btree ("user_id","activity_id");
