"use server";

import { headers } from "next/headers";
import { claimThrottle } from "@/lib/alert";
import { callerIp } from "@/lib/paddle/ips";
import { COMPANY } from "../_components/legal";
import { TOPICS } from "./topics";

/**
 * The support form.
 *
 * Deliberately not a ticketing system. It is a contact form that lands in an
 * inbox, which is the correct amount of machinery for the number of customers
 * this has. When replying by hand stops scaling, that is the signal to build
 * threads and statuses, and not a day before it.
 *
 * The two things it does have to get right are the two things a naive contact
 * form gets wrong. It must not become an open relay that lets a stranger send
 * mail from our sending domain, which is the domain magic-link sign-in also
 * depends on. And it must set reply-to, because a support form you cannot
 * simply hit reply to is a support form that gets answered slowly.
 */

/** Where tickets land. Overridable so it is not a code change to move it. */
const TO = process.env.SUPPORT_TO ?? COMPANY.email;

const FROM = process.env.ALERT_FROM ?? "Chumley <onboarding@resend.dev>";

/** Loose on purpose. Rejecting an odd but valid address costs more than a bad row. */
const LOOKS_LIKE_EMAIL = /^[^@\s]+@[^@\s.]+\.[^@\s]{2,}$/;

/** Per sender address, so one person cannot hammer it. */
const PER_EMAIL_MINUTES = 2;
/** Per IP, which is what actually stops a script looping addresses. */
const PER_IP_MINUTES = 1;

export type TicketState = {
  error: string | null;
  sent: boolean;
};

function field(data: FormData, key: string, max: number): string {
  return String(data.get(key) ?? "").trim().slice(0, max);
}

export async function submitTicket(
  _prev: TicketState,
  formData: FormData,
): Promise<TicketState> {
  // Bots fill in every field they find. Nobody real sees this one. Report
  // success: telling a bot it was caught only teaches whoever wrote it.
  if (field(formData, "website", 80)) return { error: null, sent: true };

  const name = field(formData, "name", 120);
  const email = field(formData, "email", 200).toLowerCase();
  const rawTopic = field(formData, "topic", 60);
  const topic = (TOPICS as readonly string[]).includes(rawTopic)
    ? rawTopic
    : TOPICS[0];
  const message = field(formData, "message", 5000);

  if (!email || !LOOKS_LIKE_EMAIL.test(email)) {
    return { error: "We need an email address to reply to.", sent: false };
  }
  if (message.length < 10) {
    return { error: "Tell us a bit more and we can actually help.", sent: false };
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error("[support] RESEND_API_KEY unset, ticket not sent", email);
    return {
      error: `Our form is having a moment. Email ${COMPANY.email} directly and we will pick it up.`,
      sent: false,
    };
  }

  try {
    const ip = callerIp(await headers()) ?? "unknown";
    const [ipOk, emailOk] = await Promise.all([
      claimThrottle(`support-ip-${ip}`, PER_IP_MINUTES),
      claimThrottle(`support-email-${email}`, PER_EMAIL_MINUTES),
    ]);
    /**
     * Report success on a throttle rather than an error. Somebody who
     * double-clicked submit should not be told off, and a script should not
     * learn where the limit is. The first message did go.
     */
    if (!ipOk || !emailOk) return { error: null, sent: true };

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [TO],
        // The whole point: hitting reply answers the customer, not us.
        reply_to: email,
        subject: `Support: ${topic}${name ? ` (${name})` : ""}`,
        text: [
          `From: ${name || "no name given"} <${email}>`,
          `Topic: ${topic}`,
          "",
          message,
        ].join("\n"),
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      console.error("[support] resend rejected", res.status, await res.text());
      return {
        error: `We could not send that. Email ${COMPANY.email} directly and we will pick it up.`,
        sent: false,
      };
    }

    return { error: null, sent: true };
  } catch (e) {
    console.error("[support] failed", e);
    return {
      error: `Something went wrong. Email ${COMPANY.email} directly and we will pick it up.`,
      sent: false,
    };
  }
}
