"use server";

import { redirect } from "next/navigation";
import { createOrgForUser, getCurrentUser } from "@/lib/org";

export type FormState = { error: string | null };

export async function createTeam(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    return { error: "Give your team a name." };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { error: "You need to be signed in." };
  }

  await createOrgForUser(user.id, name);
  redirect("/");
}
