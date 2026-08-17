import { relations } from "drizzle-orm";
import {
  pgTable,
  pgEnum,
  uuid,
  text,
  numeric,
  integer,
  date,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

export const membershipRoleEnum = pgEnum("membership_role", [
  "owner",
  "member",
]);

export const leadStageEnum = pgEnum("lead_stage", [
  "new_lead",
  "contacted",
  "proposal_sent",
  "won",
  "lost",
]);

export const templateChannelEnum = pgEnum("template_channel", [
  "sms",
  "email",
]);

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  webhookToken: uuid("webhook_token").notNull().defaultRandom().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull(),
    role: membershipRoleEnum("role").notNull().default("member"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [unique().on(table.orgId, table.userId)]
);

export const orgInvites = pgTable("org_invites", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  createdBy: uuid("created_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const leads = pgTable("leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  companyName: text("company_name"),
  email: text("email"),
  phone: text("phone"),
  title: text("title"),
  avatarUrl: text("avatar_url"),
  value: numeric("value", { precision: 12, scale: 2 }),
  stage: leadStageEnum("stage").notNull().default("new_lead"),
  position: integer("position").notNull().default(0),
  ownerId: uuid("owner_id"),
  nextActionText: text("next_action_text"),
  nextActionDue: date("next_action_due"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const templates = pgTable("templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  channel: templateChannelEnum("channel").notNull(),
  name: text("name").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const activities = pgTable("activities", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  leadId: uuid("lead_id")
    .notNull()
    .references(() => leads.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const organizationsRelations = relations(organizations, ({ many }) => ({
  memberships: many(memberships),
  invites: many(orgInvites),
  leads: many(leads),
  templates: many(templates),
}));

export const membershipsRelations = relations(memberships, ({ one }) => ({
  org: one(organizations, {
    fields: [memberships.orgId],
    references: [organizations.id],
  }),
}));

export const orgInvitesRelations = relations(orgInvites, ({ one }) => ({
  org: one(organizations, {
    fields: [orgInvites.orgId],
    references: [organizations.id],
  }),
}));

export const leadsRelations = relations(leads, ({ one, many }) => ({
  org: one(organizations, {
    fields: [leads.orgId],
    references: [organizations.id],
  }),
  activities: many(activities),
}));

export const templatesRelations = relations(templates, ({ one }) => ({
  org: one(organizations, {
    fields: [templates.orgId],
    references: [organizations.id],
  }),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  lead: one(leads, { fields: [activities.leadId], references: [leads.id] }),
  org: one(organizations, {
    fields: [activities.orgId],
    references: [organizations.id],
  }),
}));

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
export type Membership = typeof memberships.$inferSelect;
export type NewMembership = typeof memberships.$inferInsert;
export type OrgInvite = typeof orgInvites.$inferSelect;
export type NewOrgInvite = typeof orgInvites.$inferInsert;
export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type Template = typeof templates.$inferSelect;
export type NewTemplate = typeof templates.$inferInsert;
export type Activity = typeof activities.$inferSelect;
export type NewActivity = typeof activities.$inferInsert;
