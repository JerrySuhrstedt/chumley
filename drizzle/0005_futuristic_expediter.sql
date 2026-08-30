CREATE TABLE "uat_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tester_id" uuid,
	"check_id" text NOT NULL,
	"content_type" text NOT NULL,
	"data" "bytea" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "backlog_items" ADD COLUMN "attachments" jsonb;--> statement-breakpoint
ALTER TABLE "uat_attachments" ADD CONSTRAINT "uat_attachments_tester_id_uat_testers_id_fk" FOREIGN KEY ("tester_id") REFERENCES "public"."uat_testers"("id") ON DELETE set null ON UPDATE no action;