"use server";

import { revalidatePath } from "next/cache";
import { submitPublicLead } from "@/lib/public-form";

export type FormState = { error: string | null; done: boolean };

/**
 * The hosted form at /f/[token].
 *
 * A thin wrapper now. The rules live in lib/public-form.ts so that this
 * page, the script embed and a raw HTML post all behave identically. They
 * are three presentations of one thing, and the moment they stop sharing
 * an implementation they start disagreeing about which leads get in.
 */
export async function submitPublicForm(
  token: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const result = await submitPublicLead(token, {
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    company: formData.get("company"),
    website: formData.get("website"),
  });

  if (!result.ok) return { error: result.error, done: false };

  revalidatePath("/pipeline");
  return { error: null, done: true };
}
