"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error: string | null; sent: boolean };

export async function signInWithPassword(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/").trim() || "/";

  if (!email || !password) {
    return { error: "Enter your email and password.", sent: false };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message, sent: false };
  }

  redirect(next);
}

export async function signUpWithPassword(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/").trim() || "/";

  if (!email || !password) {
    return { error: "Enter your email and password.", sent: false };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters.", sent: false };
  }

  // Point the confirmation link back at whichever host they signed up on,
  // rather than relying on the project's single configured Site URL.
  const origin = (await headers()).get("origin");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    return { error: error.message, sent: false };
  }

  // With "Confirm email" enabled, signUp returns a user but no session.
  if (!data.session) {
    return {
      error: null,
      sent: true,
    };
  }

  redirect(next);
}

export async function sendMagicLink(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const next = String(formData.get("next") ?? "/").trim() || "/";

  if (!email) {
    return { error: "Enter an email address.", sent: false };
  }

  const origin = (await headers()).get("origin");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    return { error: error.message, sent: false };
  }

  return { error: null, sent: true };
}

export async function signInWithGoogle(formData: FormData) {
  const next = String(formData.get("next") ?? "/").trim() || "/";

  const origin = (await headers()).get("origin");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(next)}`,
    },
  });

  if (error || !data.url) {
    redirect(
      `/login?error=${encodeURIComponent(error?.message ?? "Google sign-in is unavailable.")}`
    );
  }

  // Hand off to Google. It comes back to /auth/confirm with a PKCE code,
  // which that route already knows how to exchange for a session.
  redirect(data.url);
}
