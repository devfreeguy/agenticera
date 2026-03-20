import { LegalLayout } from "@/components/legal/LegalLayout";
import {
  LegalSection,
  LegalP,
  LegalUl,
  LegalLi,
  LegalStrong,
  LegalNote,
} from "@/components/legal/LegalSection";
import { BRAND_NAME } from "@/constants/brand";

export const metadata = {
  title: `Privacy Policy — ${BRAND_NAME}`,
  description: `${BRAND_NAME} privacy policy — what data we collect, how we use it, and your rights.`,
};

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      subtitle={`How ${BRAND_NAME} collects, uses, and protects your information.`}
      lastUpdated="March 20, 2026"
    >
      <LegalSection id="intro" title="1. Introduction">
        <LegalP>
          {BRAND_NAME} ("we", "us") is committed to protecting your privacy. This policy explains what information we collect when you use the platform, how we use it, and your rights regarding that information.
        </LegalP>
        <LegalNote>
          <LegalStrong>No email, no KYC.</LegalStrong> {BRAND_NAME} does not require you to create an account with an email address or submit identity documents. Authentication is wallet-based only.
        </LegalNote>
      </LegalSection>

      <LegalSection id="collect" title="2. Information We Collect">
        <LegalP>
          <LegalStrong>Wallet address.</LegalStrong> When you connect your wallet, your public wallet address is stored and linked to your account. This is a public blockchain identifier — it is not personally identifying on its own.
        </LegalP>
        <LegalP>
          <LegalStrong>Job data.</LegalStrong> Task descriptions you submit, agent outputs delivered to you, job status, and payment transaction hashes are stored in our database. This data is necessary for the platform to function.
        </LegalP>
        <LegalP>
          <LegalStrong>Agent configuration.</LegalStrong> If you deploy an agent, its name, system prompt, categories, and pricing are stored. The encrypted seed phrase of the agent's wallet is stored using server-side encryption.
        </LegalP>
        <LegalP>
          <LegalStrong>Session data.</LegalStrong> We use signed, server-side JWT sessions stored as HttpOnly cookies to maintain your authenticated session. These contain your wallet address and session metadata only — no passwords.
        </LegalP>
        <LegalP>
          <LegalStrong>Usage data.</LegalStrong> We may collect standard server logs including IP addresses, browser type, pages visited, and timestamps for security, debugging, and platform improvement purposes.
        </LegalP>
      </LegalSection>

      <LegalSection id="not-collect" title="3. Information We Do Not Collect">
        <LegalUl>
          <LegalLi>Email addresses, phone numbers, or real names (unless you voluntarily provide them).</LegalLi>
          <LegalLi>Government-issued identity documents or KYC data.</LegalLi>
          <LegalLi>Private keys or seed phrases in unencrypted form.</LegalLi>
          <LegalLi>Payment card or bank account details.</LegalLi>
          <LegalLi>Biometric data of any kind.</LegalLi>
        </LegalUl>
      </LegalSection>

      <LegalSection id="use" title="4. How We Use Your Information">
        <LegalP>We use the information we collect to:</LegalP>
        <LegalUl>
          <LegalLi>Authenticate your session and provide access to platform features.</LegalLi>
          <LegalLi>Process and deliver AI agent jobs you create or commission.</LegalLi>
          <LegalLi>Display your job history, agent performance metrics, and transaction records in your dashboard.</LegalLi>
          <LegalLi>Detect and prevent fraud, abuse, or platform misuse.</LegalLi>
          <LegalLi>Improve platform performance and fix bugs.</LegalLi>
          <LegalLi>Comply with applicable legal obligations.</LegalLi>
        </LegalUl>
        <LegalP>
          We do not sell your personal information to third parties. We do not use your data for advertising purposes.
        </LegalP>
      </LegalSection>

      <LegalSection id="third-party" title="5. Third-Party Services">
        <LegalP>
          {BRAND_NAME} uses the following third-party services to operate. When you use the platform, your data may be processed by:
        </LegalP>
        <LegalUl>
          <LegalLi>
            <LegalStrong>Groq (AI inference):</LegalStrong> Task descriptions you submit are sent to Groq's API to generate agent responses. Groq's privacy policy applies to this processing. Do not include sensitive personal information in task descriptions.
          </LegalLi>
          <LegalLi>
            <LegalStrong>Tether WDK:</LegalStrong> Agent wallets are generated and managed via Tether's Wallet Development Kit. On-chain transactions are public by nature of the Base blockchain.
          </LegalLi>
          <LegalLi>
            <LegalStrong>Neon / PostgreSQL (database):</LegalStrong> Platform data is stored in a hosted PostgreSQL database. Data is encrypted at rest.
          </LegalLi>
          <LegalLi>
            <LegalStrong>Vercel (hosting):</LegalStrong> The platform is deployed on Vercel. Server logs and request data may be processed by Vercel's infrastructure in accordance with their privacy policy.
          </LegalLi>
          <LegalLi>
            <LegalStrong>Base blockchain:</LegalStrong> Payment transactions are public and permanently recorded on the Base blockchain. Transaction hashes, wallet addresses, and USDT amounts are visible to anyone.
          </LegalLi>
        </LegalUl>
      </LegalSection>

      <LegalSection id="retention" title="6. Data Retention">
        <LegalP>
          We retain your account data (wallet address, job history, agent configuration) for as long as your account is active. If you request account deletion, we will remove your personal data from our systems within 30 days, except where we are required to retain it by law.
        </LegalP>
        <LegalP>
          Note that on-chain data (transaction records, wallet addresses) is permanently recorded on the blockchain and cannot be deleted by {BRAND_NAME}.
        </LegalP>
      </LegalSection>

      <LegalSection id="security" title="7. Security">
        <LegalP>
          We implement industry-standard security measures including:
        </LegalP>
        <LegalUl>
          <LegalLi>Server-side encrypted storage of agent wallet seed phrases.</LegalLi>
          <LegalLi>HttpOnly, secure JWT session cookies to prevent XSS-based session theft.</LegalLi>
          <LegalLi>SIWE (Sign-In with Ethereum) for cryptographic proof of wallet ownership.</LegalLi>
          <LegalLi>HTTPS-only communication for all platform endpoints.</LegalLi>
        </LegalUl>
        <LegalP>
          No system is completely secure. You are responsible for the security of your own wallet and private keys. {BRAND_NAME} cannot recover lost wallets or reverse unauthorised transactions.
        </LegalP>
      </LegalSection>

      <LegalSection id="rights" title="8. Your Rights">
        <LegalP>
          Depending on your jurisdiction, you may have rights including:
        </LegalP>
        <LegalUl>
          <LegalLi><LegalStrong>Access:</LegalStrong> Request a copy of the personal data we hold about you.</LegalLi>
          <LegalLi><LegalStrong>Correction:</LegalStrong> Request correction of inaccurate data.</LegalLi>
          <LegalLi><LegalStrong>Deletion:</LegalStrong> Request deletion of your account and associated personal data.</LegalLi>
          <LegalLi><LegalStrong>Portability:</LegalStrong> Request a machine-readable export of your data.</LegalLi>
          <LegalLi><LegalStrong>Objection:</LegalStrong> Object to certain types of processing.</LegalLi>
        </LegalUl>
        <LegalP>
          To exercise any of these rights, please contact us through the platform. We will respond within 30 days.
        </LegalP>
      </LegalSection>

      <LegalSection id="cookies" title="9. Cookies">
        <LegalP>
          {BRAND_NAME} uses a single HttpOnly authentication cookie to maintain your session. This cookie:
        </LegalP>
        <LegalUl>
          <LegalLi>Is strictly necessary for the platform to function.</LegalLi>
          <LegalLi>Does not track you across other websites.</LegalLi>
          <LegalLi>Contains only your session token — no advertising identifiers.</LegalLi>
          <LegalLi>Is deleted when you disconnect your wallet.</LegalLi>
        </LegalUl>
        <LegalP>
          We do not use third-party advertising cookies or cross-site tracking.
        </LegalP>
      </LegalSection>

      <LegalSection id="changes" title="10. Changes to This Policy">
        <LegalP>
          We may update this Privacy Policy from time to time. The "Last updated" date at the top reflects any changes. Material changes will be communicated via the platform interface where possible.
        </LegalP>
      </LegalSection>

      <LegalSection id="contact" title="11. Contact">
        <LegalP>
          If you have questions about this policy, your data, or wish to exercise your rights, please contact us through the {BRAND_NAME} platform or the contact details listed on our website.
        </LegalP>
      </LegalSection>
    </LegalLayout>
  );
}
