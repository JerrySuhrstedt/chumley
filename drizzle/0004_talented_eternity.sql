ALTER TYPE "public"."activity_outcome" ADD VALUE 'held';--> statement-breakpoint
ALTER TYPE "public"."activity_outcome" ADD VALUE 'rescheduled';--> statement-breakpoint
ALTER TYPE "public"."activity_outcome" ADD VALUE 'no_show';--> statement-breakpoint
ALTER TYPE "public"."activity_type" ADD VALUE 'stage_change';--> statement-breakpoint
ALTER TYPE "public"."activity_type" ADD VALUE 'form_submission';