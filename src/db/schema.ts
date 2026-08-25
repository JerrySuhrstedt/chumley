import { relations, sql } from "drizzle-orm";
import {
  boolean,
  uniqueIndex,
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
  /**
   * Switched off by an administrator, without deleting anything.
   *
   * Distinct from a cancelled subscription, which is about money and
   * still leaves the board readable. This is about access: the team is
   * locked out entirely and their data sits untouched until it is undone
   * or the account is deleted for good. It is the step that was missing
   * between stopping the billing and destroying the account.
   */
  deactivatedAt: timestamp("deactivated_at", { withTimezone: true }),
  /**
   * A comped account: full access, billed nothing.
   *
   * Deliberately a property of the team rather than a fake subscription
   * row or a 100% discount in Paddle. A comp is our decision, not a
   * payment event, and modelling it as one would mean a Paddle webhook
   * could take it away, a cancellation could end it, and the seat
   * arithmetic would be reading a quantity nobody ever bought.
   *
   * Null means not comped. Set means comped, and compedUntil decides
   * whether that is forever or for a while.
   */
  compedAt: timestamp("comped_at", { withTimezone: true }),
  /** Null while compedAt is set means indefinitely. */
  compedUntil: timestamp("comped_until", { withTimezone: true }),
  /** Why, in the admin's words. An unexplained free account is a mystery
   *  to whoever finds it in six months, including the person who granted it. */
  compedReason: text("comped_reason"),
  /** Which administrator did it. auth.users id, not a membership. */
  compedBy: uuid("comped_by"),
  /**
   * A negotiated price for this team, in cents per seat per month.
   *
   * Null means the published ladder decides. Set means this number does,
   * and the volume breaks stop applying: a price agreed with a person is
   * not a quantity discount, and quietly moving somebody off the number
   * you shook hands on because they hired a fourth rep would be a nasty
   * surprise on a statement.
   *
   * Cents, as an integer, because money in a float is a bug waiting for a
   * decimal. Per seat rather than flat, so a bespoke price behaves like
   * every other price in the product when the team grows.
   */
  customPriceCents: integer("custom_price_cents"),
  /**
   * The Paddle price object created for that amount.
   *
   * Paddle can only charge against a price it knows, so the number above is
   * useless on its own. These are created on demand and reused across teams
   * on the same amount, which keeps the catalog from filling up with a
   * separate $2 price for every friend.
   */
  customPriceId: text("custom_price_id"),
  customPriceReason: text("custom_price_reason"),
  customPriceBy: uuid("custom_price_by"),
  customPriceAt: timestamp("custom_price_at", { withTimezone: true }),
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
/**
 * What kind of thing somebody is telling us.
 *
 * "praise" earns its place alongside the complaints. A form that only
 * accepts problems is a form most people never open, and the ones who
 * would have said something kind say nothing instead.
 */
export const reportKindEnum = pgEnum("report_kind", [
  "broke",
  "confusing",
  "idea",
  "praise",
]);

export const reportStatusEnum = pgEnum("report_status", [
  "new",
  "read",
  "closed",
]);

/**
 * Problems people tell us about from inside the app.
 *
 * Kept even when the team that raised it is deleted, which is why orgId
 * is nullable and set null rather than cascade: the report is evidence
 * about the product, and the most useful ones often come from somebody
 * on their way out.
 *
 * The page and the browser are captured automatically because nobody
 * types "Safari 26 on an iPhone, on the pipeline board" and a report
 * without them usually cannot be acted on.
 */
export const problemReports = pgTable("problem_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => organizations.id, {
    onDelete: "set null",
  }),
  /** Supabase uid of whoever reported it. Null once the account is gone. */
  userId: uuid("user_id"),
  /** Copied at write time so a reply is possible after the account goes. */
  email: text("email"),
  kind: reportKindEnum("kind").notNull().default("broke"),
  message: text("message").notNull(),
  /** Where they were when it went wrong. */
  pageUrl: text("page_url"),
  userAgent: text("user_agent"),
  status: reportStatusEnum("status").notNull().default("new"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type ProblemReport = typeof problemReports.$inferSelect;

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
export const subscriptions = pgTable(
  "subscriptions",
  {
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
  },
  (table) => [
    /**
     * One live subscription per team, enforced by the database.
     *
     * Cancelled rows are excluded, because a team that leaves and comes
     * back legitimately has an old cancelled row and a new active one.
     * What must never exist is two that are both billing, which is how a
     * team ends up paying twice and how a lookup starts returning whichever
     * row Postgres feels like.
     *
     * Applied straight to the database on 08-24-2026 rather than through a
     * generated migration, because drizzle-kit generate stops on an
     * unrelated enum prompt that needs a terminal. If a later generate emits
     * a CREATE for this index, the index already exists.
     */
    uniqueIndex("subscriptions_org_live_idx")
      .on(table.orgId)
      .where(sql`status <> 'canceled'`),
  ]
);

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
