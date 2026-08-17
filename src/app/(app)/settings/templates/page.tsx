import Link from "next/link";
import { eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db";
import { templates } from "@/db/schema";
import { getCurrentOrg } from "@/lib/org";
import { CreateTemplateDialog } from "./create-template-dialog";
import { DeleteTemplateButton } from "./delete-template-button";

export default async function TemplatesSettingsPage() {
  const current = await getCurrentOrg();
  if (!current) return null;

  const allTemplates = await db
    .select()
    .from(templates)
    .where(eq(templates.orgId, current.org.id));

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <Link
        href="/"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:underline"
      >
        <ArrowLeft className="size-4" />
        Back to pipeline
      </Link>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Templates</CardTitle>
          <CreateTemplateDialog />
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {allTemplates.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No templates yet — add a couple of quick follow-ups.
            </p>
          )}
          {allTemplates.map((template) => (
            <div
              key={template.id}
              className="flex items-start justify-between gap-3 rounded-md border p-3"
            >
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <p className="text-sm font-medium">{template.name}</p>
                  <Badge variant="secondary" className="uppercase">
                    {template.channel}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {template.body}
                </p>
              </div>
              <DeleteTemplateButton id={template.id} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
