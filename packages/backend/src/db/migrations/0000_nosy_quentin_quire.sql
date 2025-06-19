CREATE TABLE "bookmarks" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"bookmark_type" text NOT NULL,
	"target_id" uuid NOT NULL,
	"notes" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "data_sources" (
	"id" uuid PRIMARY KEY NOT NULL,
	"source_type" text NOT NULL,
	"source_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"url" text NOT NULL,
	"is_private" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"data_source_id" uuid NOT NULL,
	"github_event_id" text NOT NULL,
	"event_type" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"version" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"event_id" uuid,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"notification_type" text NOT NULL,
	"is_read" boolean NOT NULL,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "repositories" (
	"id" uuid PRIMARY KEY NOT NULL,
	"data_source_id" uuid NOT NULL,
	"github_id" bigint NOT NULL,
	"full_name" text NOT NULL,
	"language" text,
	"stars_count" integer NOT NULL,
	"forks_count" integer NOT NULL,
	"open_issues_count" integer NOT NULL,
	"is_fork" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "repositories_github_id_unique" UNIQUE("github_id")
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"email_notifications" boolean NOT NULL,
	"timezone" text,
	"theme" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "user_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_watches" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"data_source_id" uuid NOT NULL,
	"notification_enabled" boolean NOT NULL,
	"watch_releases" boolean NOT NULL,
	"watch_issues" boolean NOT NULL,
	"watch_pull_requests" boolean NOT NULL,
	"watch_pushes" boolean NOT NULL,
	"watch_security_alerts" boolean NOT NULL,
	"added_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"auth0_user_id" text NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"avatar_url" text NOT NULL,
	"github_username" text,
	"timezone" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_auth0_user_id_unique" UNIQUE("auth0_user_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_data_source_id_data_sources_id_fk" FOREIGN KEY ("data_source_id") REFERENCES "public"."data_sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repositories" ADD CONSTRAINT "repositories_data_source_id_data_sources_id_fk" FOREIGN KEY ("data_source_id") REFERENCES "public"."data_sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_watches" ADD CONSTRAINT "user_watches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_watches" ADD CONSTRAINT "user_watches_data_source_id_data_sources_id_fk" FOREIGN KEY ("data_source_id") REFERENCES "public"."data_sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "bookmarks_user_bookmark_target_unique" ON "bookmarks" USING btree ("user_id","bookmark_type","target_id");--> statement-breakpoint
CREATE INDEX "idx_bookmarks_user_id" ON "bookmarks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_bookmarks_target_id" ON "bookmarks" USING btree ("target_id");--> statement-breakpoint
CREATE INDEX "idx_bookmarks_type_target" ON "bookmarks" USING btree ("bookmark_type","target_id");--> statement-breakpoint
CREATE INDEX "idx_bookmarks_user_type" ON "bookmarks" USING btree ("user_id","bookmark_type");--> statement-breakpoint
CREATE INDEX "idx_bookmarks_created_at" ON "bookmarks" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "data_sources_source_type_source_id_unique" ON "data_sources" USING btree ("source_type","source_id");--> statement-breakpoint
CREATE INDEX "idx_data_sources_type" ON "data_sources" USING btree ("source_type");--> statement-breakpoint
CREATE INDEX "idx_data_sources_source_id" ON "data_sources" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "idx_data_sources_name" ON "data_sources" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_data_sources_created_at" ON "data_sources" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_data_sources_updated_at" ON "data_sources" USING btree ("updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "events_data_source_github_event_type_unique" ON "events" USING btree ("data_source_id","github_event_id","event_type");--> statement-breakpoint
CREATE INDEX "idx_events_data_source_id" ON "events" USING btree ("data_source_id");--> statement-breakpoint
CREATE INDEX "idx_events_type" ON "events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_events_title" ON "events" USING btree ("title");--> statement-breakpoint
CREATE INDEX "idx_events_version" ON "events" USING btree ("version");--> statement-breakpoint
CREATE INDEX "idx_events_github_event_id" ON "events" USING btree ("github_event_id");--> statement-breakpoint
CREATE INDEX "idx_events_data_source_type" ON "events" USING btree ("data_source_id","event_type");--> statement-breakpoint
CREATE INDEX "idx_events_data_source_created" ON "events" USING btree ("data_source_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_events_created_at" ON "events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_events_updated_at" ON "events" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "idx_notifications_user_id" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_event_id" ON "notifications" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_is_read" ON "notifications" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "idx_notifications_notification_type" ON "notifications" USING btree ("notification_type");--> statement-breakpoint
CREATE INDEX "idx_notifications_user_read" ON "notifications" USING btree ("user_id","is_read");--> statement-breakpoint
CREATE INDEX "idx_notifications_user_created" ON "notifications" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_notifications_sent_at" ON "notifications" USING btree ("sent_at");--> statement-breakpoint
CREATE INDEX "idx_notifications_created_at" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_notifications_updated_at" ON "notifications" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "idx_repositories_data_source_id" ON "repositories" USING btree ("data_source_id");--> statement-breakpoint
CREATE INDEX "idx_repositories_github_id" ON "repositories" USING btree ("github_id");--> statement-breakpoint
CREATE INDEX "idx_repositories_full_name" ON "repositories" USING btree ("full_name");--> statement-breakpoint
CREATE INDEX "idx_repositories_language" ON "repositories" USING btree ("language");--> statement-breakpoint
CREATE INDEX "idx_repositories_stars_count" ON "repositories" USING btree ("stars_count");--> statement-breakpoint
CREATE INDEX "idx_repositories_created_at" ON "repositories" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_repositories_updated_at" ON "repositories" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "idx_user_preferences_user_id" ON "user_preferences" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_preferences_created_at" ON "user_preferences" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_user_preferences_updated_at" ON "user_preferences" USING btree ("updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "user_watches_user_id_data_source_id_unique" ON "user_watches" USING btree ("user_id","data_source_id");--> statement-breakpoint
CREATE INDEX "idx_user_watches_user_id" ON "user_watches" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_watches_data_source_id" ON "user_watches" USING btree ("data_source_id");--> statement-breakpoint
CREATE INDEX "idx_user_watches_added_at" ON "user_watches" USING btree ("added_at");--> statement-breakpoint
CREATE INDEX "idx_users_auth0_user_id" ON "users" USING btree ("auth0_user_id");--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_users_github_username" ON "users" USING btree ("github_username");--> statement-breakpoint
CREATE INDEX "idx_users_created_at" ON "users" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_users_updated_at" ON "users" USING btree ("updated_at");