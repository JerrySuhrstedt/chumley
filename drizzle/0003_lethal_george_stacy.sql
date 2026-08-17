CREATE TYPE "public"."activity_outcome" AS ENUM('connected', 'voicemail', 'no_answer', 'bad_number');--> statement-breakpoint
CREATE TYPE "public"."activity_type" AS ENUM('call', 'email', 'text', 'meeting', 'note');--> statement-breakpoint
ALTER TABLE "activities" ALTER COLUMN "body" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "type" "activity_type" DEFAULT 'note' NOT NULL;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "outcome" "activity_outcome";--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "created_by" uuid;