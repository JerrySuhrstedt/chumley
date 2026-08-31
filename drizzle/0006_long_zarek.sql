ALTER TABLE "uat_testers" ADD COLUMN "focus" jsonb;--> statement-breakpoint
ALTER TABLE "uat_testers" ADD COLUMN "round" integer DEFAULT 0 NOT NULL;