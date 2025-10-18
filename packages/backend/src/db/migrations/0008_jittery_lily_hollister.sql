ALTER TABLE "notifications" ADD COLUMN "scheduled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
-- ユーザーのタイムゾーンでの時刻を保存 (例: "18:00"はユーザーのタイムゾーンで18:00を意味する)
ALTER TABLE "user_preferences" ADD COLUMN "digest_notification_times" text[] DEFAULT '{"18:00"}' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "notifications_user_id_activity_id_unique" ON "notifications" USING btree ("user_id","activity_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_status" ON "notifications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_notifications_scheduled_at" ON "notifications" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "idx_notifications_status_scheduled" ON "notifications" USING btree ("status","scheduled_at");