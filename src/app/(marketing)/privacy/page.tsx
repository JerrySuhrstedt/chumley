import type { Metadata } from "next";
import Link from "next/link";
import {
  Bullets,
  COMPANY,
  ContactBlock,
  DataTable,
  LegalPage,
  Section,
} from "../_components/legal";

export const metadata: Metadata = {
  title: "Privacy Policy | Sell1",
  description:
    "How SumoLab LLC collects, uses, shares, and protects personal information in the Sell1 service.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro={`This Privacy Policy explains how ${COMPANY.legalName} ("SumoLab," "we," "us," or "our") collects, uses, discloses, and safeguards personal information in connection with ${COMPANY.product}, our sales pipeline software, together with the sell1.app website and any related services (collectively, the "Service"). Please read it carefully. By creating an account or otherwise using the Service, you acknowledge the practices described here.`}
    >
      <Section heading="1. Two roles: controller and processor">
        <p>
          Our privacy obligations depend on whose information is involved, and
          the distinction matters throughout this policy.
        </p>
        <Bullets
          items={[
            <>
              <strong>We are the controller</strong> of information about our
              own users: the person who signs up, their account credentials,
              their profile, and their use of the Service. This policy governs
              that information.
            </>,
            <>
              <strong>We are a processor</strong> of the customer data you put
              into the Service, including records about your leads, prospects,
              and contacts. You decide what to collect, why, and how long to
              keep it. We process it on your instructions in order to provide
              the Service. If you are one of our customers&apos; contacts and
              want your information corrected or deleted, please contact that
              business directly, since they control it. We will assist them in
              responding.
            </>,
          ]}
        />
      </Section>

      <Section heading="2. Information we collect">
        <p>
          <strong>Information you provide directly.</strong>
        </p>
        <Bullets
          items={[
            <>
              <strong>Account information.</strong> Your email address and a
              password. Passwords are salted and hashed by our authentication
              provider; we never receive or store your password in readable
              form.
            </>,
            <>
              <strong>Profile information.</strong> Your name, job title,
              LinkedIn profile URL, headshot image link, and your team or
              company name, where you choose to supply them.
            </>,
            <>
              <strong>Customer data.</strong> The records you create or import,
              including contact names, business names, email addresses,
              telephone numbers, deal values, pipeline stages, next steps,
              notes, and logged activity such as calls, emails, texts, and
              meetings. You control the contents of these records.
            </>,
            <>
              <strong>Communications.</strong> Messages you send us for support
              or other enquiries.
            </>,
          ]}
        />

        <p className="mt-2">
          <strong>Information from third-party sign-in.</strong> If you sign in
          using Google or LinkedIn, that provider sends us your name, email
          address, profile picture, and a unique identifier. We do not receive
          your password for those accounts and we do not post anything to them.
          You may instead sign in with an email address and password and skip
          this entirely.
        </p>

        <p className="mt-2">
          <strong>Information collected automatically.</strong> Our hosting and
          infrastructure providers record standard server logs, including IP
          address, browser type, pages requested, and timestamps, which are used
          for security, abuse prevention, and diagnosing faults.
        </p>

        <p className="mt-2">
          <strong>What we do not collect.</strong> We do not run advertising
          networks, third-party analytics, session recording, or cross-site
          tracking on the Service. We do not connect to your email inbox and we
          do not read your email. We do not knowingly collect information from
          anyone under 18.
        </p>
      </Section>

      <Section heading="3. How we use information">
        <Bullets
          items={[
            "To provide, operate, and maintain the Service and its features.",
            "To create and authenticate your account and keep you signed in.",
            "To send transactional messages such as sign-up confirmations, password resets, and notices about security or material changes to the Service.",
            "To respond to your support requests.",
            "To monitor for, investigate, and prevent fraud, abuse, and security incidents.",
            "To understand which features are used so we can improve the Service, using aggregated information that does not identify any individual.",
            "To comply with legal obligations and enforce our Terms of Service.",
          ]}
        />
        <p>
          <strong>
            We do not sell personal information, and we do not share it for
            cross-context behavioral advertising.
          </strong>{" "}
          We do not use your customer data to train machine learning models, and
          we do not use it for any purpose other than providing the Service to
          you.
        </p>
      </Section>

      <Section heading="4. Legal bases for processing">
        <p>
          Where the General Data Protection Regulation or the UK GDPR applies,
          we rely on the following legal bases: performance of a contract, to
          provide the Service you have signed up for; our legitimate interests,
          in securing the Service, preventing abuse, and improving our product,
          balanced against your rights; compliance with a legal obligation; and
          consent, where we ask for it, which you may withdraw at any time.
        </p>
      </Section>

      <Section heading="5. How we share information">
        <p>
          We disclose personal information only as described below. We do not
          sell it, rent it, or trade it.
        </p>
        <Bullets
          items={[
            <>
              <strong>Members of your team.</strong> Everyone in your workspace
              can see the records in that workspace, along with your name, job
              title, and headshot. There are no per-user visibility restrictions
              within a workspace.
            </>,
            <>
              <strong>Service providers (subprocessors).</strong> The vendors
              listed below process information on our behalf under contractual
              confidentiality and security obligations.
            </>,
            <>
              <strong>Legal and safety.</strong> Where we reasonably believe
              disclosure is required by law, subpoena, or other legal process,
              or is necessary to protect the rights, property, or safety of
              SumoLab, our users, or the public.
            </>,
            <>
              <strong>Business transfers.</strong> In connection with a merger,
              acquisition, financing, or sale of assets, subject to the acquirer
              honoring this policy for previously collected information. We will
              give notice before your information becomes subject to a different
              policy.
            </>,
          ]}
        />

        <p className="mt-2">
          <strong>Current subprocessors:</strong>
        </p>
        <DataTable
          head={["Provider", "Purpose", "Location"]}
          rows={[
            [
              "Supabase",
              "Database hosting and user authentication",
              "Canada (AWS)",
            ],
            ["Vercel", "Application hosting and content delivery", "United States"],
            ["Resend", "Transactional email delivery", "United States"],
            [
              "Google, LinkedIn",
              "Optional sign-in, only if you choose to use it",
              "United States",
            ],
            [
              "DuckDuckGo",
              "Retrieves a company icon from a website domain; no personal information is sent",
              "United States",
            ],
          ]}
        />
        <p>
          We will update this list before adding a new subprocessor that
          processes personal information.
        </p>
      </Section>

      <Section heading="6. Cookies and similar technologies">
        <p>
          We use strictly necessary cookies only. These store your
          authentication session so you stay signed in and remain secure while
          moving between pages, and they retain small interface preferences such
          as whether your sidebar is collapsed. We do not use advertising,
          analytics, or tracking cookies, which is why the Service does not
          display a cookie consent banner. Blocking essential cookies will
          prevent you from signing in.
        </p>
      </Section>

      <Section heading="7. International transfers">
        <p>
          We are based in the United States and our providers operate in the
          United States and Canada. If you access the Service from outside those
          countries, your information will be transferred to and processed
          there, where data protection laws may differ from those in your
          jurisdiction. Where required, we rely on the European Commission&apos;s
          Standard Contractual Clauses or an equivalent transfer mechanism.
        </p>
      </Section>

      <Section heading="8. Data retention">
        <p>
          We retain account and profile information for as long as your account
          is active. Customer data is retained until you delete it or until your
          account is closed. When you close your account, we delete or
          irreversibly anonymize the associated data within 30 days, except
          where we must retain records to comply with a legal obligation,
          resolve a dispute, or enforce our agreements. Backups are purged on a
          rolling schedule not exceeding 90 days. You can export your data at
          any time before closing an account, and we will assist if you need
          help doing so.
        </p>
      </Section>

      <Section heading="9. Security">
        <p>
          We use technical and organizational measures appropriate to the risk,
          including encryption in transit using TLS, encryption at rest for
          stored data, hashed passwords, access controls scoped so that a
          workspace can reach only its own records, and infrastructure operated
          by established providers. No method of transmission or storage is
          completely secure, so we cannot guarantee absolute security. If we
          become aware of a breach affecting your personal information, we will
          notify you and any relevant regulator as required by applicable law.
        </p>
      </Section>

      <Section heading="10. Your rights and choices">
        <p>
          Depending on where you live, you may have some or all of the following
          rights regarding personal information we hold about you as controller:
        </p>
        <Bullets
          items={[
            "Access a copy of your personal information.",
            "Correct information that is inaccurate or incomplete.",
            "Delete your personal information.",
            "Port your information to another service in a machine-readable format.",
            "Object to or restrict certain processing.",
            "Withdraw consent where processing is based on consent.",
            "Be free from discrimination for exercising any of these rights.",
          ]}
        />
        <p>
          You can update your name, job title, LinkedIn URL, and headshot at any
          time from the profile screen inside the Service. For anything else,
          email us at{" "}
          <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>. We will
          respond within the period required by applicable law, generally 30
          days, and we may need to verify your identity first. An authorized
          agent may submit a request on your behalf with proof of authority.
          Residents of the European Economic Area and the United Kingdom may
          also lodge a complaint with their local supervisory authority.
        </p>
      </Section>

      <Section heading="11. Children's privacy">
        <p>
          The Service is a business tool and is not directed to children. We do
          not knowingly collect personal information from anyone under 18. If
          you believe a child has provided us with personal information, contact
          us and we will delete it.
        </p>
      </Section>

      <Section heading="12. Changes to this policy">
        <p>
          We may update this policy from time to time. If we make a material
          change, we will revise the effective date above and notify account
          holders by email or through a notice in the Service before the change
          takes effect. Your continued use of the Service after an update
          constitutes acceptance of the revised policy.
        </p>
      </Section>

      <Section heading="13. Contact us">
        <p>
          Questions, requests, or complaints about this policy or our handling
          of personal information can be sent to:
        </p>
        <ContactBlock />
        <p>
          See also our{" "}
          <Link href="/terms" className="font-medium text-[var(--brand)] hover:underline">
            Terms of Service
          </Link>
          .
        </p>
      </Section>
    </LegalPage>
  );
}
