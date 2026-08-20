CREATE TYPE "public"."report_kind" AS ENUM('broke', 'confusing', 'idea', 'praise');
--> statement-breakpoint
ALTER TABLE "problem_reports" ADD COLUMN "kind" "report_kind" DEFAULT 'broke' NOT NULL;
