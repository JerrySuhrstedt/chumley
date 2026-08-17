"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function sendMagicLink(
  _prevState: { error: string | null; sent: boolean },
  formData: FormData
) {
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
