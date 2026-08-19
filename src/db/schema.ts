import { relations } from "drizzle-orm";
import {
  boolean,
  pgTable,
  pgEnum,
  uuid,
  text,
  numeric,
  integer,
  date,
  jsonb,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

export const membershipRoleEnum = pgEnum("membership_role", [
  "owner",
  "member",
]);

/** How warm the lead feels. Set by hand, never inferred. */
export const leadTemperatureEnum = pgEnum("lead_temperature", [
  "hot",
  "warm",
  "cold",
]);

/**
 * The buckets every team starts with.
 *
 * These are seeds, not a fixed set. A team can rename them, reorder them
 * and add their own, so leads.stage is plain text keyed to a row in
 * `stages` rather than a database enum. Keeping the original keys means
 * the leads that already exist needed no rewriting when this changed.
 */
export const DEFAULT_STAGE_KEYS = [
  "new_lead",
  "contacted",
  "proposal_sent",
  "won",
  "lost",
  /**
   * Known to you, but not yet working in the pipeline: imported lists,
   * networking, past customers. Deliberately not a board column, and not
   * something a team can delete, because Contacts is a whole screen.
   */
  "contact",
] as const;

/** What a bucket means to the arithmetic, regardless of its name. */
export const stageKindEnum = pgEnum("stage_kind", [
  // A live deal, somewhere in the middle. These are the ones a team adds.
  "open",
  // Closed and counted as revenue. Exactly one per team.
  "won",
  // Closed and not. Exactly one per team.
  "lost",
  // Off the board entirely. Exactly one per team, never shown as a column.
  "contact",
]);

export const templateChannelEnum = pgEnum("template_channel", [
  "sms",
  "email",
]);

export const activityTypeEnum = pgEnum("activity_type", [
  "call",
  "email",
  "text",
  "meeting",
  "note",
  // Recorded by the app rather than typed by a rep.
  "stage_change",
  "form_submission",
]);

/** Dispositions for calls and meetings. Null for everything else. */
export const activityOutcomeEnum = pgEnum("activity_outcome", [
  "connected",
  "voicemail",
  "no_answer",
  "bad_number",
  "held",
  "rescheduled",
  "no_show",
]);

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  /**
   * Superseded by the `stages` table, which carries names and order both.
   * Kept so the first read for a team can carry its existing renames
   * across. Nothing writes here any more.
   */
  stageLabels: jsonb("stage_labels").$type<Record<string, string>>(),
  webhookToken: uuid("webhook_token").notNull().defaultRandom().unique(),
  /** Heading shown above the embeddable website form. Plain text only. */
  formHeading: text("form_heading"),
  /**
   * The Paddle customer this team bills as. Set by the first checkout and
   * kept afterwards, so a team that cancels and returns is the same
   * customer rather than a second one.
   */
  paddleCustomerId: text("paddle_customer_id"),
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
    displayName: text("display_name"),
    jobTitle: text("job_title"),
    linkedinUrl: text("linkedin_url"),
    // Filled from the sign-in provider when there is one, or pasted by hand.
    avatarUrl: text("avatar_url"),
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

/**
 * A team's board columns.
 *
 * Rows are created the first time a team's board is read, seeded from the
 * defaults and from whatever names they had already set, so nobody has to
 * be migrated ahead of time and a team that never opens the board never
 * gets rows at all.
 *
 * `key` rather than the row id is what leads store, so renaming a bucket
 * is free and deleting one leaves data that can still be read.
 */
export const stages = pgTable(
  "stages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    /** What leads.stage holds. Stable for the life of the bucket. */
    key: text("key").notNull(),
    label: text("label").notNull(),
    /** What this bucket means to the arithmetic, whatever it is called. */
    kind: stageKindEnum("kind").notNull().default("open"),
    /** Left to right. Won and lost are forced to the end when read. */
    position: integer("position").notNull().default(0),
    color: text("color").notNull().default("#2a78d6"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    // One bucket per key per team. Also what makes the seeding idempotent:
    // two simultaneous first-reads cannot produce a doubled board.
    unique("stages_org_key_unique").on(t.orgId, t.key),
  ]
);

export type Stage = typeof stages.$inferSelect;

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
  /**
   * Which bucket this lead sits in, by `stages.key`. Text rather than a
   * foreign key on purpose: a lead must survive its bucket being renamed
   * or deleted, and a dangling key falls back to the first column rather
   * than breaking a query.
   */
  stage: text("stage").notNull().default("new_lead"),
  temperature: leadTemperatureEnum("temperature"),
  /** Seeded on signup so a new board demonstrates itself. Clearable. */
  isSample: boolean("is_sample").notNull().default(false),
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
  /** Email only. Texts have no subject line. */
  subject: text("subject"),
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
  type: activityTypeEnum("type").notNull().default("note"),
  outcome: activityOutcomeEnum("outcome"),
  body: text("body").notNull().default(""),
  createdBy: uuid("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * A team's subscription, mirrored from Paddle.
 *
 * Webhooks are the source of truth and write here; the app only ever
 * reads. Keyed by Paddle's own id so a repeated delivery converges on the
 * same row instead of creating a second one, and so events arriving out of
 * order still settle correctly.
 *
 * Scoped to the organization rather than the user, because the team is what
 * gets billed. A manager paying for six reps is one subscription, not six.
 */
export const subscriptions = pgTable("subscriptions", {
  /** Paddle's subscription id, sub_01h... */
  id: text("id").primaryKey(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  customerId: text("customer_id").notNull(),
  /** active | trialing | past_due | paused | canceled */
  status: text("status").notNull(),
  priceId: text("price_id").notNull(),
  productId: text("product_id"),
  /** Seats paid for. This is what the invite flow checks against. */
  quantity: integer("quantity").notNull().default(1),
  /**
   * Set when a cancel or pause is pending. Status stays active until the
   * date arrives, so this is the difference between "they cancelled" and
   * "their access has ended".
   */
  scheduledChangeAt: timestamp("scheduled_change_at", { withTimezone: true }),
  scheduledChangeAction: text("scheduled_change_action"),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  org: one(organizations, {
    fields: [subscriptions.orgId],
    references: [organizations.id],
  }),
}));

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
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type Activity = typeof activities.$inferSelect;
export type NewActivity = typeof activities.$inferInsert;
