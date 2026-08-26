"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function signOut() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/login");
}
