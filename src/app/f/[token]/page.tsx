import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { PublicForm } from "./public-form";

export const metadata: Metadata = {
  title: "Contact form",
  // This page lives inside somebody else's website; it should never be
  // the thing a search engine returns.
  robots: { index: false, follow: false },
};

export default async function PublicFormPage({
  params,
}: PageProps<"/f/[token]">) {
  const { token } = await params;

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.webhookToken, token),
  });

  if (!org) notFound();

  return (
    // Transparent, so the form sits on whatever colour the host page uses.
    <div className="min-h-full bg-transparent p-1">
      <PublicForm
        token={token}
        heading={org.formHeading?.trim() || "Get in touch"}
      />
    </div>
  );
}
