ALTER TABLE "events" RENAME TO "activities";--> statement-breakpoint
ALTER TABLE "activities" RENAME COLUMN "event_type" TO "activity_type";--> statement-breakpoint
ALTER TABLE "notifications" RENAME COLUMN "event_id" TO "activity_id";--> statement-breakpoint
ALTER TABLE "activities" DROP CONSTRAINT "events_data_source_id_data_sources_id_fk";
--> statement-breakpoint
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_event_id_events_id_fk";
--> statement-breakpoint
DROP INDEX "events_data_source_github_event_type_unique";--> statement-breakpoint
DROP INDEX "idx_events_data_source_id";--> statement-breakpoint
DROP INDEX "idx_events_type";--> statement-breakpoint
DROP INDEX "idx_events_title";--> statement-breakpoint
DROP INDEX "idx_events_version";--> statement-breakpoint
DROP INDEX "idx_events_github_event_id";--> statement-breakpoint
DROP INDEX "idx_events_data_source_type";--> statement-breakpoint
DROP INDEX "idx_events_data_source_created";--> statement-breakpoint
DROP INDEX "idx_events_status";--> statement-breakpoint
DROP INDEX "idx_events_created_at";--> statement-breakpoint
DROP INDEX "idx_events_updated_at";--> statement-breakpoint
DROP INDEX "idx_notifications_event_id";--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_data_source_id_data_sources_id_fk" FOREIGN KEY ("data_source_id") REFERENCES "public"."data_sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "activities_data_source_github_activity_type_unique" ON "activities" USING btree ("data_source_id","github_event_id","activity_type");--> statement-breakpoint
CREATE INDEX "idx_activities_data_source_id" ON "activities" USING btree ("data_source_id");--> statement-breakpoint
CREATE INDEX "idx_activities_type" ON "activities" USING btree ("activity_type");--> statement-breakpoint
CREATE INDEX "idx_activities_title" ON "activities" USING btree ("title");--> statement-breakpoint
CREATE INDEX "idx_activities_version" ON "activities" USING btree ("version");--> statement-breakpoint
CREATE INDEX "idx_activities_github_event_id" ON "activities" USING btree ("github_event_id");--> statement-breakpoint
CREATE INDEX "idx_activities_data_source_type" ON "activities" USING btree ("data_source_id","activity_type");--> statement-breakpoint
CREATE INDEX "idx_activities_data_source_created" ON "activities" USING btree ("data_source_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_activities_status" ON "activities" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_activities_created_at" ON "activities" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_activities_updated_at" ON "activities" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "idx_notifications_activity_id" ON "notifications" USING btree ("activity_id");