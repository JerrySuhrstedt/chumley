CREATE TYPE "public"."activity_outcome" AS ENUM('connected', 'voicemail', 'no_answer', 'bad_number', 'held', 'rescheduled', 'no_show');--> statement-breakpoint
CREATE TYPE "public"."activity_type" AS ENUM('call', 'email', 'text', 'meeting', 'note', 'stage_change', 'form_submission');--> statement-breakpoint
CREATE TYPE "public"."lead_temperature" AS ENUM('hot', 'warm', 'cold');--> statement-breakpoint
CREATE TYPE "public"."membership_role" AS ENUM('owner', 'member');--> statement-breakpoint
CREATE TYPE "public"."report_kind" AS ENUM('broke', 'confusing', 'idea', 'praise');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('new', 'read', 'closed');--> statement-breakpoint
CREATE TYPE "public"."stage_kind" AS ENUM('open', 'won', 'lost', 'contact');--> statement-breakpoint
CREATE TYPE "public"."template_channel" AS ENUM('sms', 'email');--> statement-breakpoint
CREATE TABLE "activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"lead_id" uuid NOT NULL,
	"type" "activity_type" DEFAULT 'note' NOT NULL,
	"outcome" "activity_outcome",
	"body" text DEFAULT '' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alert_log" (
	"key" text PRIMARY KEY NOT NULL,
	"last_sent_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" text NOT NULL,
	"company_name" text,
	"email" text,
	"phone" text,
	"title" text,
	"avatar_url" text,
	"value" numeric(12, 2),
	"stage" text DEFAULT 'new_lead' NOT NULL,
	"temperature" "lead_temperature",
	"is_sample" boolean DEFAULT false NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"owner_id" uuid,
	"next_action_text" text,
	"next_action_due" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "membership_role" DEFAULT 'member' NOT NULL,
	"display_name" text,
	"job_title" text,
	"linkedin_url" text,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "memberships_org_id_user_id_unique" UNIQUE("org_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "org_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"token" text NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "org_invites_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"stage_labels" jsonb,
	"webhook_token" uuid DEFAULT gen_random_uuid() NOT NULL,
	"form_heading" text,
	"paddle_customer_id" text,
	"deactivated_at" timestamp with time zone,
	"comped_at" timestamp with time zone,
	"comped_until" timestamp with time zone,
	"comped_reason" text,
	"comped_by" uuid,
	"custom_price_cents" integer,
	"custom_price_id" text,
	"custom_price_reason" text,
	"custom_price_by" uuid,
	"custom_price_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_webhook_token_unique" UNIQUE("webhook_token")
);
--> statement-breakpoint
CREATE TABLE "problem_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid,
	"user_id" uuid,
	"email" text,
	"kind" "report_kind" DEFAULT 'broke' NOT NULL,
	"message" text NOT NULL,
	"page_url" text,
	"user_agent" text,
	"status" "report_status" DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"kind" "stage_kind" DEFAULT 'open' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"color" text DEFAULT '#2a78d6' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stages_org_key_unique" UNIQUE("org_id","key")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" uuid NOT NULL,
	"customer_id" text NOT NULL,
	"status" text NOT NULL,
	"price_id" text NOT NULL,
	"product_id" text,
	"quantity" integer DEFAULT 1 NOT NULL,
	"scheduled_change_at" timestamp with time zone,
	"scheduled_change_action" text,
	"current_period_end" timestamp with time zone,
	"trial_ends_at" timestamp with time zone,
	"occurred_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"channel" "template_channel" NOT NULL,
	"name" text NOT NULL,
	"subject" text,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_invites" ADD CONSTRAINT "org_invites_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem_reports" ADD CONSTRAINT "problem_reports_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stages" ADD CONSTRAINT "stages_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "templates" ADD CONSTRAINT "templates_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "subscriptions_org_live_idx" ON "subscriptions" USING btree ("org_id") WHERE status <> 'canceled';