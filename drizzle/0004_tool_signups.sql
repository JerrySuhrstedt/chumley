CREATE TABLE "tool_signups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"tool" text DEFAULT 'sales-pipeline-tracker' NOT NULL,
	"token" uuid DEFAULT gen_random_uuid() NOT NULL,
	"emailed_at" timestamp with time zone,
	"downloaded_at" timestamp with time zone,
	"download_count" integer DEFAULT 0 NOT NULL,
	"source" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tool_signups_token_unique" UNIQUE("token"),
	CONSTRAINT "tool_signups_email_tool_unique" UNIQUE("email","tool")
);
--> statement-breakpoint
CREATE INDEX "tool_signups_created_idx" ON "tool_signups" USING btree ("created_at" DESC NULLS LAST);