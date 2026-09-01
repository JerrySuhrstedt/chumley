-- Captures three objects that were applied to production by hand and
-- lived in no migration (notify_new_leads, lead_notice_log, retest_at),
-- plus the genuinely new one-team-per-user unique index. Written with
-- IF NOT EXISTS throughout so it is a no-op against the live database
-- and correct against a fresh rebuild, which is the whole point of
-- baselining the journal.
CREATE TABLE IF NOT EXISTS "lead_notice_log" (
	"org_id" uuid PRIMARY KEY NOT NULL,
	"last_sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"pending" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "notify_new_leads" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "uat_testers" ADD COLUMN IF NOT EXISTS "retest_at" timestamp with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "memberships_user_id_key" ON "memberships" USING btree ("user_id");
