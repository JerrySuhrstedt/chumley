"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { APIError } from "better-auth/api";
import { auth } from "@/lib/auth";

export type LoginState = { error: string | null; sent: boolean };

/** Better Auth throws APIError with a readable message; everything else is generic. */
function messageOf(e: unknown): string {
  if (e instanceof APIError) return e.message;
  return "Sign-in failed. Try again.";
}

/**
 * Where to land after signing in. Same-site relative paths only: `next`
 * arrives from the browser and feeds redirects and OAuth callback URLs,
 * so anything absolute or protocol-shaped would be an open redirect.
 */
function safeNext(formData: FormData): string {
  const raw = String(formData.get("next") ?? "").trim();
  if (raw.startsWith("/") && !raw.startsWith("//") && !raw.includes(":")) {
    return raw;
  }
  return "/pipeline";
}

export async function signInWithPassword(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData);

  if (!email || !password) {
    return { error: "Enter your email and password.", sent: false };
  }

  try {
    await auth.api.signInEmail({
      body: { email, password },
      headers: await headers(),
    });
  } catch (e) {
    return { error: messageOf(e), sent: false };
  }

  redirect(next);
}

export async function signUpWithPassword(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData);

  if (!email || !password) {
    return { error: "Enter your email and password.", sent: false };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters.", sent: false };
  }

  try {
    await auth.api.signUpEmail({
      // The name is required by the schema and asked for later, in the
      // name step after the first deal. The email prefix stands in.
      body: { email, password, name: email.split("@")[0] },
      headers: await headers(),
    });
  } catch (e) {
    return { error: messageOf(e), sent: false };
  }

  // Signing up signs you in. No confirmation email standing in the way;
  // the address gets proven the first time a magic link is used.
  redirect(next);
}

export async function sendMagicLink(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const next = safeNext(formData);

  if (!email) {
    return { error: "Enter an email address.", sent: false };
  }

  try {
    await auth.api.signInMagicLink({
      body: { email, callbackURL: next },
      headers: await headers(),
    });
  } catch (e) {
    return { error: messageOf(e), sent: false };
  }

  return { error: null, sent: true };
}

type OAuthProvider = "google" | "linkedin";

/**
 * Hands off to the provider. Better Auth builds the authorization URL
 * against our own OAuth apps and handles the callback on
 * /api/auth/callback/<provider>; both providers return a profile photo,
 * which lands on the user record and becomes the default headshot.
 */
async function startOAuth(provider: OAuthProvider, formData: FormData) {
  const next = safeNext(formData);

  let url: string | undefined;
  try {
    const result = await auth.api.signInSocial({
      body: {
        provider,
        callbackURL: next,
        // Failures land back on the login page, which maps the error
        // code to words. Without this they fall through to better-auth's
        // /api/auth/error, which in production bounces to the marketing
        // homepage with a raw query string and no message anywhere.
        errorCallbackURL: `/login?next=${encodeURIComponent(next)}`,
      },
      headers: await headers(),
    });
    url = result.url ?? undefined;
  } catch {
    url = undefined;
  }

  if (!url) {
    redirect(`/login?error=provider_unavailable&provider=${provider}`);
  }

  redirect(url);
}

export async function signInWithGoogle(formData: FormData) {
  await startOAuth("google", formData);
}

export async function signInWithLinkedIn(formData: FormData) {
  await startOAuth("linkedin", formData);
}
