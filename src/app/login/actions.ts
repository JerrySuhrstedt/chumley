"use server";

import { createClient } from "@/lib/supabase/server";

export async function sendMagicLink(
  _prevState: { error: string | null; sent: boolean },
  formData: FormData
) {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    return { error: "Enter an email address.", sent: false };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });

  if (error) {
    return { error: error.message, sent: false };
  }

  return { error: null, sent: true };
}
