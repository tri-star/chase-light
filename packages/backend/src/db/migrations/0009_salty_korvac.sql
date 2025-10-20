CREATE TABLE "notification_activities" (
	"notification_id" uuid NOT NULL,
	"activity_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_digest_execution_logs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"worker_name" varchar(255) NOT NULL,
	"last_successful_run_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "notifications_user_activity_unique";--> statement-breakpoint
ALTER TABLE "notification_activities" ADD CONSTRAINT "notification_activities_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_activities" ADD CONSTRAINT "notification_activities_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_digest_execution_logs" ADD CONSTRAINT "user_digest_execution_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "notification_activities_pk" ON "notification_activities" USING btree ("notification_id","activity_id");--> statement-breakpoint
CREATE INDEX "idx_notification_activities_notification" ON "notification_activities" USING btree ("notification_id");--> statement-breakpoint
CREATE INDEX "idx_notification_activities_activity" ON "notification_activities" USING btree ("activity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_digest_execution_logs_user_worker_unique" ON "user_digest_execution_logs" USING btree ("user_id","worker_name");--> statement-breakpoint
CREATE INDEX "idx_user_digest_execution_logs_user_worker" ON "user_digest_execution_logs" USING btree ("user_id","worker_name");--> statement-breakpoint
CREATE INDEX "idx_user_digest_execution_logs_updated_at" ON "user_digest_execution_logs" USING btree ("updated_at");