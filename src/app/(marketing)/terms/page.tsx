import type { Metadata } from "next";
import Link from "next/link";
import {
  Bullets,
  COMPANY,
  ContactBlock,
  LegalPage,
  Section,
} from "../_components/legal";

export const metadata: Metadata = {
  title: "Terms of Service | Chumley",
  description:
    "The agreement between SumoLab LLC and users of the Chumley sales pipeline service.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      intro={`These Terms of Service ("Terms") form a binding agreement between you and ${COMPANY.legalName} ("SumoLab," "we," "us," or "our") governing your access to and use of ${COMPANY.product}, our sales pipeline software, together with the chumley.app website and any related services (collectively, the "Service"). By creating an account, accessing, or using the Service, you agree to these Terms. If you do not agree, do not use the Service.`}
    >
      <Section heading="1. Eligibility and your account">
        <p>
          You must be at least 18 years old and able to form a binding contract
          to use the Service. If you are using the Service on behalf of a
          company or other organization, you represent that you have authority
          to bind that entity, and &ldquo;you&rdquo; refers to that entity.
        </p>
        <p>
          You are responsible for maintaining the confidentiality of your
          credentials and for all activity that occurs under your account. Give
          us accurate information and keep it current. Notify us promptly at{" "}
          <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> if you suspect
          unauthorized use of your account.
        </p>
        <p>
          Anyone you invite into your workspace can view and modify all records
          in that workspace. You are responsible for who you invite and for
          removing access when someone leaves.
        </p>
      </Section>

      <Section heading="2. Early access and free service">
        <p>
          <strong>
            The Service is currently offered free of charge as an early access
            release.
          </strong>{" "}
          Early access means the Service is under active development. Features
          may change, be added, or be withdrawn; the Service may contain defects
          or behave unexpectedly; and it is provided without any service level
          commitment, uptime guarantee, or formal support obligation.
        </p>
        <p>
          We may introduce paid plans in the future. We will give existing
          account holders at least 30 days&apos; advance notice by email before
          any charge applies to them, and no charge will ever be made without
          your express consent.
        </p>
      </Section>

      <Section heading="3. Your data and ownership">
        <p>
          <strong>You own your data.</strong> As between you and SumoLab, you
          retain all rights to the records, contacts, notes, and other content
          you submit to the Service (&ldquo;Customer Data&rdquo;). We claim no
          ownership over it.
        </p>
        <p>
          You grant us a limited, non-exclusive, worldwide, royalty-free license
          to host, store, transmit, display, and process Customer Data solely as
          necessary to provide and maintain the Service for you, and to comply
          with law. This license ends when you delete the data or close your
          account. We do not use Customer Data to train machine learning models,
          and we do not sell it or disclose it to third parties except as
          described in our{" "}
          <Link href="/privacy">Privacy Policy</Link>.
        </p>
        <p>
          We own the Service itself, including its software, design, and
          trademarks. These Terms grant you a limited, revocable,
          non-transferable, non-exclusive right to use the Service, and nothing
          more.
        </p>
      </Section>

      <Section heading="4. Your responsibilities for contact information">
        <p>
          This section matters more than most, because the Service stores
          information about other people.
        </p>
        <p>
          You are solely responsible for the Customer Data you upload and for
          how you use it. You represent and warrant that you have all rights,
          consents, and lawful bases necessary to collect, store, and process
          the personal information you put into the Service, and that your use
          of it complies with all applicable laws. These include, without
          limitation, the Telephone Consumer Protection Act, the CAN-SPAM Act,
          state and federal do-not-call rules, and, where applicable, the
          General Data Protection Regulation and state privacy statutes.
        </p>
        <p>
          The Service provides buttons that hand off to your own phone, messaging,
          and email applications. It does not send calls, texts, or email on your
          behalf. You alone are responsible for the content, timing, legality,
          and consent status of every communication you initiate.
        </p>
      </Section>

      <Section heading="5. Acceptable use">
        <p>You agree not to, and not to permit anyone else to:</p>
        <Bullets
          items={[
            "Use the Service for any unlawful purpose or in violation of any applicable law or regulation.",
            "Upload unlawful, infringing, defamatory, or malicious content, or any code intended to disrupt or damage software or hardware.",
            "Send unsolicited bulk communications, or use data from the Service in a manner that violates anti-spam or telemarketing law.",
            "Attempt to gain unauthorized access to the Service, other accounts, or the systems or networks connected to it.",
            "Reverse engineer, decompile, or attempt to derive the source code of the Service, except to the extent that restriction is prohibited by law.",
            "Resell, sublicense, or provide the Service to third parties as a standalone offering.",
            "Circumvent usage limits, or use automated means to access the Service in a way that imposes an unreasonable load on our infrastructure.",
            "Use the Service to build a competing product, or to benchmark it for publication without our prior written consent.",
          ]}
        />
      </Section>

      <Section heading="6. Third-party services">
        <p>
          The Service may connect with third-party services you choose to use,
          including Google and LinkedIn sign-in and any automation platform you
          connect through our inbound webhook. Your use of those services is
          governed by their own terms and privacy policies. We are not
          responsible for third-party services and we do not warrant their
          availability, security, or performance.
        </p>
      </Section>

      <Section heading="7. Availability, modification, and suspension">
        <p>
          We aim to keep the Service available but do not guarantee
          uninterrupted access. We may modify, suspend, or discontinue any part
          of the Service at any time. Where we discontinue the Service entirely,
          we will provide at least 30 days&apos; notice and a reasonable
          opportunity to export your data.
        </p>
        <p>
          We may suspend or terminate your access immediately if we reasonably
          believe you have violated these Terms, if your use poses a security
          risk or a risk of liability to us or others, or if required by law.
        </p>
      </Section>

      <Section heading="8. Termination">
        <p>
          You may stop using the Service and close your account at any time by
          contacting us at{" "}
          <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>. On
          termination, your right to use the Service ends immediately and we
          will delete your Customer Data in accordance with the retention
          practices described in our{" "}
          <Link href="/privacy">Privacy Policy</Link>. Export anything you want
          to keep before closing your account. Sections 3, 4, 9, 10, 11, 12, and
          13 survive termination.
        </p>
      </Section>

      <Section heading="9. Disclaimer of warranties">
        <p>
          <strong>
            THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS
            AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS,
            IMPLIED, OR STATUTORY.
          </strong>{" "}
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES,
          INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
          PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. WE DO NOT WARRANT
          THAT THE SERVICE WILL BE UNINTERRUPTED, TIMELY, SECURE, OR ERROR-FREE,
          OR THAT DATA WILL NOT BE LOST. YOU ARE RESPONSIBLE FOR MAINTAINING
          YOUR OWN COPIES OF ANY DATA THAT MATTERS TO YOU.
        </p>
      </Section>

      <Section heading="10. Limitation of liability">
        <p>
          <strong>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, SUMOLAB WILL NOT BE LIABLE
            FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR EXEMPLARY
            DAMAGES,
          </strong>{" "}
          INCLUDING LOSS OF PROFITS, REVENUE, GOODWILL, BUSINESS OPPORTUNITY, OR
          DATA, WHETHER IN CONTRACT, TORT, OR ANY OTHER THEORY, EVEN IF ADVISED
          OF THE POSSIBILITY OF SUCH DAMAGES.
        </p>
        <p>
          <strong>
            OUR TOTAL AGGREGATE LIABILITY ARISING OUT OF OR RELATING TO THESE
            TERMS OR THE SERVICE WILL NOT EXCEED THE GREATER OF THE AMOUNT YOU
            PAID US IN THE TWELVE MONTHS PRECEDING THE CLAIM, OR ONE HUNDRED
            U.S. DOLLARS ($100).
          </strong>{" "}
          Because the Service is currently provided free of charge, you
          acknowledge that this cap may be one hundred dollars. Some
          jurisdictions do not allow certain limitations, so parts of this
          section may not apply to you.
        </p>
      </Section>

      <Section heading="11. Indemnification">
        <p>
          You agree to defend, indemnify, and hold harmless SumoLab and its
          officers, members, and agents from any claims, damages, liabilities,
          and expenses, including reasonable attorneys&apos; fees, arising out
          of your Customer Data, your use of the Service, your violation of
          these Terms, or your violation of any law or the rights of a third
          party.
        </p>
      </Section>

      <Section heading="12. Governing law and disputes">
        <p>
          These Terms are governed by the laws of the State of {COMPANY.state},
          United States, without regard to its conflict of laws rules. You and
          SumoLab agree to the exclusive jurisdiction of the state and federal
          courts located in Maricopa County, Arizona, and waive any objection to
          venue there.
        </p>
        <p>
          Before filing a claim, you agree to contact us at{" "}
          <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> and attempt to
          resolve the dispute informally for at least 30 days. Each party waives
          any right to participate in a class or representative action, to the
          extent permitted by law.
        </p>
      </Section>

      <Section heading="13. General">
        <p>
          These Terms, together with our{" "}
          <Link href="/privacy">Privacy Policy</Link>, are the entire agreement
          between you and SumoLab regarding the Service. If any provision is
          held unenforceable, the rest remains in effect. Our failure to enforce
          a provision is not a waiver of it. You may not assign these Terms
          without our written consent; we may assign them in connection with a
          merger, acquisition, or sale of assets. Nothing in these Terms creates
          a partnership, joint venture, or employment relationship.
        </p>
        <p>
          We may update these Terms from time to time. If we make a material
          change, we will revise the effective date above and notify account
          holders by email or in the Service before it takes effect. Continued
          use after the effective date constitutes acceptance.
        </p>
      </Section>

      <Section heading="14. Contact us">
        <p>Questions about these Terms can be sent to:</p>
        <ContactBlock />
      </Section>
    </LegalPage>
  );
}
