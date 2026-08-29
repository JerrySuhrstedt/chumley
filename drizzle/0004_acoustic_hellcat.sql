CREATE INDEX "activities_lead_idx" ON "activities" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "activities_org_created_idx" ON "activities" USING btree ("org_id","created_at");--> statement-breakpoint
CREATE INDEX "leads_org_idx" ON "leads" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "memberships_user_idx" ON "memberships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "templates_org_idx" ON "templates" USING btree ("org_id");