import type { Metadata } from "next";
import Link from "next/link";
import {
  Bullets,
  COMPANY,
  ContactBlock,
  LegalPage,
  MERCHANT,
  MerchantNotice,
  Section,
} from "../_components/legal";
import { TRIAL_DAYS } from "../pricing/plans";

export const metadata: Metadata = {
  title: "Refund Policy | Chumley",
  description:
    "Cancel any time in one click, and a 30-day money-back guarantee on your first payment for Chumley.",
};

export default function RefundsPage() {
  return (
    <LegalPage
      title="Refund Policy"
      intro={`How cancellations and refunds work for ${COMPANY.product}. This policy forms part of our Terms of Service and applies to every subscription bought through chumley.app.`}
    >
      <Section heading="The short version">
        <Bullets
          items={[
            `Try it for ${TRIAL_DAYS} days without paying anything and without giving us a card.`,
            "Cancel any time, in one click, from inside the app. No contract, no minimum term, nobody to email.",
            "If you pay and it is not for you, tell us within 30 days of that first payment and we refund it in full.",
            "Whatever happens, you keep your data and you can always export it.",
          ]}
        />
      </Section>

      <Section heading="1. The free trial comes first">
        <p>
          Every new account gets {TRIAL_DAYS} days of the complete product at no
          charge, and we do not ask for a payment method to start one. The trial
          exists so that nobody has to buy this to find out whether it suits how
          they work. Use it. If the answer is no, do nothing and you will never
          be charged.
        </p>
      </Section>

      <Section heading="2. Canceling your subscription">
        <p>
          You can cancel at any time. Sign in, go to{" "}
          <strong>Settings, then Billing</strong>, and choose to cancel. It
          takes one click and it does not require you to contact us, sit through
          a retention offer, or explain yourself.
        </p>
        <p>
          Cancellation takes effect at the end of the billing period you have
          already paid for. You keep full access until that date and you are not
          charged again. We do not automatically refund the unused remainder of
          a period on cancellation, because you keep the service for all of it.
        </p>
        <p>
          If you would rather we canceled it for you, email{" "}
          <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> from the
          address on the account and we will do it the same business day.
        </p>
      </Section>

      <Section heading="3. The 30-day money-back guarantee">
        <p>
          <strong>
            If you are not happy with {COMPANY.product}, email us within 30 days
            of your first payment and we will refund it in full.
          </strong>{" "}
          You do not have to give a reason, and it applies to monthly and yearly
          plans alike.
        </p>
        <p>
          Send the request to{" "}
          <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> from the email
          address on the account, and say that you want a refund. That is the
          whole process. We will acknowledge it within one business day and
          submit the refund immediately.
        </p>
      </Section>

      <Section heading="4. Renewals">
        <p>
          Subscriptions renew automatically, and we email you before a yearly
          plan renews so the charge is never a surprise.
        </p>
        <p>
          If a renewal catches you out anyway and you have not meaningfully used
          the Service in that new period,{" "}
          <strong>
            contact us within 14 days of the renewal charge and we will cancel
            the subscription and refund it.
          </strong>{" "}
          We would rather refund a renewal you did not want than argue about it.
        </p>
        <p>
          Outside that window, we do not refund renewals mid-period. Cancel
          before the renewal date and you will not be charged for the next one.
        </p>
      </Section>

      <Section heading="5. Seats you added part way through">
        <p>
          Adding a person to your team adds a seat, prorated for the rest of the
          current period. If you add someone by mistake, remove them and email
          us within 14 days and we will refund the prorated charge.
        </p>
        <p>
          Removing a person frees their seat at your next renewal, and the bill
          drops from that point. We do not refund seats you have already used
          for the period.
        </p>
      </Section>

      <Section heading="6. When we will not refund">
        <p>To be straight with you about the exceptions, which are few:</p>
        <Bullets
          items={[
            "Accounts we terminate for a breach of the Terms of Service, including using the Service to send unlawful or unsolicited bulk messages.",
            "Requests made more than 30 days after a first payment, or more than 14 days after a renewal or a seat charge, except where the law in your country gives you a longer right.",
            "Charges you have already disputed with your bank, because the money is being handled through that process instead. Talk to us first and it will be faster.",
          ]}
        />
        <p>
          If we ever shut the Service down entirely, we refund the unused
          portion of whatever you have paid for. That is in section 10 of the{" "}
          <Link href="/terms">Terms of Service</Link> and it is a commitment, not
          a courtesy.
        </p>
      </Section>

      <Section heading="7. How the money actually comes back">
        <p>
          Refunds are issued to the original payment method. Once submitted,
          they usually appear within 5 to 10 business days, though the exact
          timing is set by your bank or card issuer rather than by us.
        </p>
        <p>
          Any sales tax or VAT charged on the original payment is refunded along
          with it.
        </p>
        <MerchantNotice className="mt-1" />
        <p>
          Because {MERCHANT.short} is the merchant of record, the refund is
          processed by {MERCHANT.short} and will show against the{" "}
          {MERCHANT.statement} entry on your statement, not as a payment from{" "}
          {COMPANY.legalName}.
        </p>
      </Section>

      <Section heading="8. Your data is never the leverage">
        <p>
          Whether you cancel, take a refund, or simply stop paying, your records
          stay yours. Your workspace becomes read-only rather than locked, you
          can still sign in and read everything, and you can export all of it at
          any time. We do not delete your data because of non-payment and we do
          not hold it to make leaving harder.
        </p>
      </Section>

      <Section heading="9. Your statutory rights">
        <p>
          Nothing in this policy limits any right you have under the consumer
          law of your own country, including the statutory right of withdrawal
          available to consumers in the United Kingdom and the European Union.
          Where the law gives you more than this policy does, the law wins.
        </p>
      </Section>

      <Section heading="10. Contact us">
        <p>
          Refund requests, billing questions, and anything you think we have got
          wrong:
        </p>
        <ContactBlock />
      </Section>
    </LegalPage>
  );
}
