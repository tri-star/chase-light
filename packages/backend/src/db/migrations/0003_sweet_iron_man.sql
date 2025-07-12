ALTER TABLE "bookmarks" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "bookmarks" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "data_sources" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "data_sources" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "repositories" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "repositories" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preferences" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preferences" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_watches" ALTER COLUMN "added_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "updated_at" SET NOT NULL;