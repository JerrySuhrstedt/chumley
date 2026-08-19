-- Custom board columns.
--
-- leads.stage moves from a database enum to plain text. The existing
-- values are already the strings we want, so USING stage::text rewrites
-- nothing meaningful and every lead keeps the bucket it was in. The old
-- type is left in place rather than dropped, so this migration can be
-- reversed without needing the enum definition back.

CREATE TYPE "public"."stage_kind" AS ENUM('open', 'won', 'lost', 'contact');
--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "stage" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "stage" SET DATA TYPE text USING "stage"::text;
--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "stage" SET DEFAULT 'new_lead';
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
ALTER TABLE "stages" ADD CONSTRAINT "stages_org_id_organizations_id_fk"
	FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "stages_org_position_idx" ON "stages" ("org_id","position");
