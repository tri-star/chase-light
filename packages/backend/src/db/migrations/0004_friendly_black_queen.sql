ALTER TABLE "events" ADD COLUMN "status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "status_detail" text DEFAULT null;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "github_data" text DEFAULT null;--> statement-breakpoint
CREATE INDEX "idx_events_status" ON "events" USING btree ("status");