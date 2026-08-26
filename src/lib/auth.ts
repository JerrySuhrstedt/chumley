import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { randomUUID } from "crypto";
import { db } from "@/db";
import { users, sessions, accounts, verifications } from "@/db/auth-schema";

/**
 * Auth, owned by the app instead of rented from a vendor.
 *
 * Better Auth stores users and sessions in our own Postgres, talks to the
 * Google and LinkedIn OAuth apps we already owned, and sends magic links
 * through the Resend account the alerts already use. After the 08-25-2026
 * Supabase incident took logins and the database down together, the whole
 * point of this file is that auth now only goes down when the app does.
 *
 * Existing users keep their Supabase-era uuids (see scripts/seed-auth-users
 * and generateId below), which is what spares memberships from a remap.
 *
 * Passwords deliberately did not migrate: Supabase kept the hashes in a
 * scheme worth leaving behind, every affected account belongs to the alpha
 * group, and the magic link signs them in with nothing to remember. New
 * passwords can be set after that first login.
 */

const FROM = process.env.ALERT_FROM ?? "Chumley <onboarding@resend.dev>";

async function sendMagicLinkEmail(email: string, url: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to: email,
      subject: "Your sign-in link for Chumley",
      text: [
        "Click to sign in to Chumley:",
        "",
        url,
        "",
        "The link works once and expires in 5 minutes.",
        "If you didn't ask for it, ignore this email and nothing happens.",
      ].join("\n"),
    }),
  });
  if (!res.ok) {
    throw new Error(`Magic link email failed: ${res.status}`);
  }
}

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: users,
      session: sessions,
      account: accounts,
      verification: verifications,
    },
  }),
  advanced: {
    database: {
      // uuid columns, and ids that match the ones Supabase minted.
      generateId: () => randomUUID(),
    },
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    },
    linkedin: {
      clientId: process.env.LINKEDIN_CLIENT_ID ?? "",
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET ?? "",
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      // A Google or LinkedIn sign-in whose verified email matches an
      // existing user attaches to that user instead of creating a twin.
      // This is how every migrated user reclaims their account on the
      // first login without any reclaim ceremony.
      trustedProviders: ["google", "linkedin"],
    },
  },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await sendMagicLinkEmail(email, url);
      },
    }),
    // Last on purpose: lets server actions set the session cookie.
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
