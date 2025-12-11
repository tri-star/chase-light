ALTER TABLE "activities" ADD COLUMN "body_translation_status" text DEFAULT 'completed' NOT NULL;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "body_translation_status_detail" text;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "body_translation_requested_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "body_translation_started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "body_translation_completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "body_translation_message_id" text;--> statement-breakpoint
CREATE INDEX "idx_activities_body_translation_status" ON "activities" USING btree ("body_translation_status");--> statement-breakpoint
CREATE INDEX "idx_activities_body_translation_requested_at" ON "activities" USING btree ("body_translation_requested_at" DESC);