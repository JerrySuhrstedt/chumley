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

  const scriptCode = `<script src="${origin}/embed.js" data-form="${current.org.webhookToken}" async></script>`;

  const htmlCode = `<form action="${origin}/api/forms/${current.org.webhookToken}" method="POST">
  <input type="hidden" name="_redirect" value="https://your-site.com/thank-you">

  <label>First name<input name="firstName" required></label>
  <label>Last name<input name="lastName" required></label>
  <label>Email<input name="email" type="email" required></label>
  <label>Phone<input name="phone" type="tel"></label>
  <label>Company<input name="company"></label>

  <input name="website" tabindex="-1" style="position:absolute;left:-9999px" aria-hidden="true">

  <button type="submit">Send</button>
</form>`;

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
            <EmbedCode code={scriptCode} />
            <div className="rounded-lg border border-[var(--brand)]/30 bg-[var(--brand-tint)] p-3 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">
                Why this one is the one to use
              </p>
              <p className="mt-1">
                The form is not written into your website, it is loaded from
                here every time somebody visits. So when we improve it, add a
                field, or fix something, your site gets the new version on its
                own. You never have to paste anything again.
              </p>
              <p className="mt-2">
                It also grows to fit its own content, so it will never be cut
                off or leave a gap, and your website&rsquo;s styling cannot
                accidentally break it.
              </p>
            </div>
            <a
              href={formUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-[var(--brand)] hover:underline"
            >
              See what it looks like
              <ExternalLink className="size-3.5" />
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Make it match your website</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-sm text-slate-600">
              Optional. Add any of these to the line above and it changes to
              suit. Leave them out and it uses sensible defaults.
            </p>
            <ul className="flex flex-col gap-2 text-sm">
              {[
                ["data-accent=\"#0a66c2\"", "Your brand colour, for the button and the highlights"],
                ["data-heading=\"Get a quote\"", "Words above the form"],
                ["data-button=\"Send it over\"", "What the button says"],
                ["data-thanks=\"We will call you today.\"", "What they see after sending"],
              ].map(([attr, why]) => (
                <li key={attr} className="flex flex-col gap-0.5">
                  <code className="w-fit rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-800">
                    {attr}
                  </code>
                  <span className="text-slate-600">{why}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Or build your own form</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-sm text-slate-600">
              For a web designer who wants the form to be part of the page,
              styled exactly like everything else around it. This is plain
              HTML with no JavaScript at all. It posts here and the lead lands
              on your board the same way.
            </p>
            <EmbedCode code={htmlCode} />
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">
                One thing to know before you choose this
              </p>
              <p className="mt-1">
                This is a copy, frozen the moment it is pasted. When we improve
                the form, this one will not change, because it lives on your
                website rather than ours. Somebody would have to come back and
                update it by hand.
              </p>
              <p className="mt-2">
                Change the <code className="rounded bg-white px-1 py-0.5 font-mono text-xs">_redirect</code>{" "}
                line to a thank-you page on your own site, or delete it and we
                will show ours.
              </p>
            </div>
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
