CREATE TYPE "public"."report_status" AS ENUM('new', 'read', 'closed');
--> statement-breakpoint
CREATE TABLE "problem_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid,
	"user_id" uuid,
	"email" text,
	"message" text NOT NULL,
	"page_url" text,
	"user_agent" text,
	"status" "report_status" DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "problem_reports" ADD CONSTRAINT "problem_reports_org_id_organizations_id_fk"
	FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "problem_reports_status_created_idx" ON "problem_reports" ("status","created_at" DESC);
