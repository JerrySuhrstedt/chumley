"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { companies } from "@/db/schema";

export type FormState = { error: string | null };

function toNullable(value: FormDataEntryValue | null) {
  const str = String(value ?? "").trim();
  return str.length > 0 ? str : null;
}

export async function createCompany(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const name = toNullable(formData.get("name"));
  if (!name) {
    return { error: "Name is required." };
  }

  const [company] = await db
    .insert(companies)
    .values({
      name,
      domain: toNullable(formData.get("domain")),
      notes: toNullable(formData.get("notes")),
    })
    .returning({ id: companies.id });

  revalidatePath("/companies");
  redirect(`/companies/${company.id}`);
}

export async function updateCompany(
  id: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const name = toNullable(formData.get("name"));
  if (!name) {
    return { error: "Name is required." };
  }

  await db
    .update(companies)
    .set({
      name,
      domain: toNullable(formData.get("domain")),
      notes: toNullable(formData.get("notes")),
    })
    .where(eq(companies.id, id));

  revalidatePath("/companies");
  revalidatePath(`/companies/${id}`);
  return { error: null };
}

export async function deleteCompany(id: string) {
  await db.delete(companies).where(eq(companies.id, id));
  revalidatePath("/companies");
  redirect("/companies");
}
