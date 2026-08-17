import { Mail, MessageSquare, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Lead, Template } from "@/db/schema";

function fillTemplate(body: string, lead: Lead) {
  return body.replaceAll("{{name}}", lead.name);
}

export function TapToContact({
  lead,
  templates,
  size = "icon",
  stopPropagation = false,
}: {
  lead: Lead;
  templates?: Template[];
  size?: "icon" | "default";
  stopPropagation?: boolean;
}) {
  const smsTemplate = templates?.find((t) => t.channel === "sms");
  const emailTemplate = templates?.find((t) => t.channel === "email");

  const smsBody = smsTemplate ? fillTemplate(smsTemplate.body, lead) : "";
  const emailBody = emailTemplate
    ? fillTemplate(emailTemplate.body, lead)
    : "";

  const stop = stopPropagation
    ? (e: React.MouseEvent) => e.stopPropagation()
    : undefined;

  const telHref = lead.phone ? `tel:${lead.phone}` : "#";
  const smsHref = lead.phone
    ? `sms:${lead.phone}${smsBody ? `?&body=${encodeURIComponent(smsBody)}` : ""}`
    : "#";
  const mailHref = lead.email
    ? `mailto:${lead.email}${emailBody ? `?body=${encodeURIComponent(emailBody)}` : ""}`
    : "#";

  return (
    <div className="flex gap-1" onClick={stop}>
      <Button
        render={<a href={telHref} />}
        variant="outline"
        size={size}
        disabled={!lead.phone}
        className={size === "default" ? "flex-1" : undefined}
      >
        <Phone className="size-4" />
        {size === "default" && "Call"}
      </Button>
      <Button
        render={<a href={smsHref} />}
        variant="outline"
        size={size}
        disabled={!lead.phone}
        className={size === "default" ? "flex-1" : undefined}
      >
        <MessageSquare className="size-4" />
        {size === "default" && "Text"}
      </Button>
      <Button
        render={<a href={mailHref} />}
        variant="outline"
        size={size}
        disabled={!lead.email}
        className={size === "default" ? "flex-1" : undefined}
      >
        <Mail className="size-4" />
        {size === "default" && "Email"}
      </Button>
    </div>
  );
}
