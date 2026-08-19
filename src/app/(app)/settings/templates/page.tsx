import Link from "next/link";
import { eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db";
import { templates } from "@/db/schema";
import { getCurrentOrg } from "@/lib/org";
import { TemplateDialog } from "./template-dialog";
import { DeleteTemplateButton } from "./delete-template-button";

export default async function TemplatesSettingsPage() {
  const current = await getCurrentOrg();
  if (!current) return null;

  const allTemplates = await db
    .select()
    .from(templates)
    .where(eq(templates.orgId, current.org.id));

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-6">
      <div className="mx-auto flex max-w-lg flex-col gap-6">
      <Link
        href="/settings"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:underline"
      >
        <ArrowLeft className="size-4" />
        Back to settings
      </Link>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Saved messages</CardTitle>
          <TemplateDialog />
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {allTemplates.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nothing saved yet. Add the texts and emails you send over and over.
            </p>
          )}
          {allTemplates.map((template) => (
            <div
              key={template.id}
              className="flex items-start justify-between gap-3 rounded-md border p-3"
            >
              <div className="min-w-0">
                <div className="mb-1 flex items-center gap-2">
                  <p className="text-sm font-medium">{template.name}</p>
                  <Badge variant="secondary">
                    {template.channel === "sms" ? "Text" : "Email"}
                  </Badge>
                </div>
                {template.subject && (
                  <p className="text-sm font-medium text-slate-700">
                    {template.subject}
                  </p>
                )}
                <p className="text-sm whitespace-pre-line text-muted-foreground">
                  {template.body}
                </p>
              </div>
              <div className="flex shrink-0 items-center">
                <TemplateDialog template={template} />
                <DeleteTemplateButton id={template.id} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
