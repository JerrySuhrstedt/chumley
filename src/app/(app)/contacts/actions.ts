"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { activities, contacts } from "@/db/schema";

export type FormState = { error: string | null };

function toNullable(value: FormDataEntryValue | null) {
  const str = String(value ?? "").trim();
  return str.length > 0 ? str : null;
}

export async function createContact(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const firstName = toNullable(formData.get("firstName"));
  if (!firstName) {
    return { error: "First name is required." };
  }

  const [contact] = await db
    .insert(contacts)
    .values({
      firstName,
      lastName: toNullable(formData.get("lastName")),
      email: toNullable(formData.get("email")),
      phone: toNullable(formData.get("phone")),
      companyId: toNullable(formData.get("companyId")),
      notes: toNullable(formData.get("notes")),
    })
    .returning({ id: contacts.id });

  revalidatePath("/contacts");
  redirect(`/contacts/${contact.id}`);
}

export async function updateContact(
  id: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const firstName = toNullable(formData.get("firstName"));
  if (!firstName) {
    return { error: "First name is required." };
  }

  await db
    .update(contacts)
    .set({
      firstName,
      lastName: toNullable(formData.get("lastName")),
      email: toNullable(formData.get("email")),
      phone: toNullable(formData.get("phone")),
      companyId: toNullable(formData.get("companyId")),
      notes: toNullable(formData.get("notes")),
    })
    .where(eq(contacts.id, id));

  revalidatePath("/contacts");
  revalidatePath(`/contacts/${id}`);
  return { error: null };
}

export async function deleteContact(id: string) {
  await db.delete(contacts).where(eq(contacts.id, id));
  revalidatePath("/contacts");
  redirect("/contacts");
}

export async function addContactNote(
  contactId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const body = toNullable(formData.get("body"));
  if (!body) {
    return { error: "Note can't be empty." };
  }

  await db.insert(activities).values({
    type: "note",
    body,
    contactId,
  });

  revalidatePath(`/contacts/${contactId}`);
  return { error: null };
}
