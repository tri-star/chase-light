CREATE TABLE "notification_digest_entries" (
	"id" uuid PRIMARY KEY NOT NULL,
	"notification_id" uuid NOT NULL,
	"data_source_id" uuid NOT NULL,
	"data_source_name" text NOT NULL,
	"activity_type" text NOT NULL,
	"activity_id" uuid NOT NULL,
	"position" smallint NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"url" text,
	"generator" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_digest_user_states" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"last_successful_run_at" timestamp with time zone,
	"last_attempted_run_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notification_digest_entries" ADD CONSTRAINT "notification_digest_entries_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_digest_entries" ADD CONSTRAINT "notification_digest_entries_data_source_id_data_sources_id_fk" FOREIGN KEY ("data_source_id") REFERENCES "public"."data_sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_digest_entries" ADD CONSTRAINT "notification_digest_entries_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_digest_user_states" ADD CONSTRAINT "notification_digest_user_states_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_notification_digest_entries_notification_id" ON "notification_digest_entries" USING btree ("notification_id");--> statement-breakpoint
CREATE INDEX "idx_notification_digest_entries_data_source_id" ON "notification_digest_entries" USING btree ("data_source_id");--> statement-breakpoint
CREATE INDEX "idx_notification_digest_entries_activity_id" ON "notification_digest_entries" USING btree ("activity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "notification_digest_entries_unique" ON "notification_digest_entries" USING btree ("notification_id","data_source_id","activity_type","position");--> statement-breakpoint
CREATE INDEX "idx_notification_digest_user_states_last_successful_run_at" ON "notification_digest_user_states" USING btree ("last_successful_run_at");