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
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "paddle_customer_id" text;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;