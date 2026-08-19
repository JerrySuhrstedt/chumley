import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentOrg } from "@/lib/org";
import { getOrigin } from "@/lib/site-url";
import { EmbedCode } from "./embed-code";
import { saveFormHeading } from "./actions";

export default async function WebsiteFormPage() {
  const current = await getCurrentOrg();
  if (!current) return null;

  const origin = await getOrigin();
  const formUrl = `${origin}/f/${current.org.webhookToken}`;
  const heading = current.org.formHeading ?? "";

  const code = `<iframe src="${formUrl}" width="100%" height="620" frameborder="0" style="border:0;max-width:520px"></iframe>`;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-6">
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <Link
          href="/settings"
          className="flex items-center gap-1 text-sm text-slate-500 hover:underline"
        >
          <ArrowLeft className="size-4" />
          Back to settings
        </Link>

        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Form for your website
          </h1>
          <p className="text-sm text-slate-500">
            Put this form on your website. Anyone who fills it out shows up on
            your board on their own.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your heading</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={saveFormHeading} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="formHeading">
                  The words above the form
                </Label>
                <Input
                  id="formHeading"
                  name="formHeading"
                  defaultValue={heading}
                  maxLength={80}
                  placeholder="Get in touch"
                />
                <p className="text-xs text-slate-500">
                  Plain words only. Leave it empty and it says &quot;Get in
                  touch&quot;.
                </p>
              </div>
              <Button type="submit" className="self-start">
                Save
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>The code</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-sm text-slate-600">
              Copy this and paste it into your website where you want the form
              to appear. If someone else looks after your website, send it to
              them. Nothing else needs doing.
            </p>
            <EmbedCode code={code} />
            <a
              href={formUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-[var(--board-bg)] hover:underline"
            >
              See what it looks like
              <ExternalLink className="size-3.5" />
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What it asks for</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2 text-sm text-slate-700">
              {[
                ["First name", true],
                ["Last name", true],
                ["Email", true],
                ["Company", false],
                ["Phone", false],
              ].map(([label, required]) => (
                <li key={label as string} className="flex items-center gap-2">
                  <span className="font-medium">{label}</span>
                  <span className="text-xs text-slate-500">
                    {required ? "required" : "optional"}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-slate-500">
              The form is the same for everybody. That is on purpose, so there
              is nothing to set up and nothing that can break.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
