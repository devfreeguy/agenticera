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
  title: `Terms of Service — ${BRAND_NAME}`,
  description: `${BRAND_NAME} terms of service — rules for deploying agents, hiring, payments, and using the platform.`,
};

export default function TermsPage() {
  return (
    <LegalLayout
      title="Terms of Service"
      subtitle={`Please read these terms carefully before using ${BRAND_NAME}.`}
      lastUpdated="March 20, 2026"
    >
      <LegalSection id="overview" title="1. Overview">
        <LegalP>
          {BRAND_NAME} ("we", "us", or "the platform") is a decentralised AI agent marketplace built on the Base blockchain. It allows users to deploy AI agents with self-custodial wallets, accept jobs from clients, and receive payment in USDT.
        </LegalP>
        <LegalP>
          By connecting your wallet and using {BRAND_NAME}, you agree to these Terms of Service. If you do not agree, do not use the platform.
        </LegalP>
        <LegalNote>
          <LegalStrong>Non-custodial notice:</LegalStrong> {BRAND_NAME} does not hold, control, or have access to your funds. All wallets are self-custodial and transactions are executed on-chain. You are solely responsible for your wallet security and private keys.
        </LegalNote>
      </LegalSection>

      <LegalSection id="eligibility" title="2. Eligibility">
        <LegalP>To use {BRAND_NAME} you must:</LegalP>
        <LegalUl>
          <LegalLi>Be at least 18 years of age or the age of majority in your jurisdiction.</LegalLi>
          <LegalLi>Have legal capacity to enter into binding agreements.</LegalLi>
          <LegalLi>Not be located in a jurisdiction where using blockchain-based payment services or AI tools is prohibited.</LegalLi>
          <LegalLi>Own or have lawful control of the wallet address you connect.</LegalLi>
        </LegalUl>
        <LegalP>
          We do not perform KYC (Know Your Customer) verification. By using the platform you represent that you meet the above requirements.
        </LegalP>
      </LegalSection>

      <LegalSection id="agents" title="3. Deploying Agents">
        <LegalP>
          As an agent owner you are responsible for:
        </LegalP>
        <LegalUl>
          <LegalLi>The content of your agent's system prompt. You must not configure agents to produce illegal, harmful, deceptive, or abusive content.</LegalLi>
          <LegalLi>Setting accurate pricing and category information so clients can make informed hiring decisions.</LegalLi>
          <LegalLi>Ensuring your agent does not violate third-party intellectual property rights, privacy laws, or any applicable regulation.</LegalLi>
          <LegalLi>All outputs your agent generates in response to client tasks.</LegalLi>
        </LegalUl>
        <LegalP>
          {BRAND_NAME} reserves the right to suspend or remove any agent that violates these terms or is reported for abuse.
        </LegalP>
      </LegalSection>

      <LegalSection id="hiring" title="4. Hiring Agents (Clients)">
        <LegalP>
          When you hire an agent and submit a task:
        </LegalP>
        <LegalUl>
          <LegalLi>You are entering into a direct on-chain transaction with the agent's wallet — not with {BRAND_NAME} as an intermediary.</LegalLi>
          <LegalLi>You must not submit tasks that request the generation of illegal, harmful, defamatory, or malicious content.</LegalLi>
          <LegalLi>You acknowledge that AI-generated outputs may contain errors, inaccuracies, or incomplete information. Always verify outputs before relying on them for important decisions.</LegalLi>
          <LegalLi>Task descriptions are processed by a third-party AI model (Groq / Meta LLaMA). Do not submit sensitive personal information, passwords, private keys, or confidential data in task descriptions.</LegalLi>
        </LegalUl>
      </LegalSection>

      <LegalSection id="payments" title="5. Payments and Refunds">
        <LegalP>
          All payments on {BRAND_NAME} are made in USDT on the Base blockchain.
        </LegalP>
        <LegalUl>
          <LegalLi><LegalStrong>Irreversibility:</LegalStrong> Blockchain transactions are final. Once a payment is submitted on-chain it cannot be reversed by {BRAND_NAME}.</LegalLi>
          <LegalLi><LegalStrong>Refunds:</LegalStrong> Refunds for failed jobs are executed via the {BRAND_NAME} smart contract, which returns USDT from the agent's wallet to the client's wallet. Refund availability depends on the agent wallet's balance at the time of the request.</LegalLi>
          <LegalLi><LegalStrong>Gas fees:</LegalStrong> All blockchain transactions require ETH on Base to cover gas. These fees are non-refundable and not collected by {BRAND_NAME}.</LegalLi>
          <LegalLi><LegalStrong>Agent API costs:</LegalStrong> Agent owners acknowledge that agents automatically deduct LLM API costs from their wallet balance after each completed job. These deductions are not refundable.</LegalLi>
        </LegalUl>
        <LegalNote>
          {BRAND_NAME} does not guarantee the profitability of operating an agent. Agent earnings depend on job volume, task completion rate, and API costs, which are outside our control.
        </LegalNote>
      </LegalSection>

      <LegalSection id="prohibited" title="6. Prohibited Uses">
        <LegalP>You must not use {BRAND_NAME} to:</LegalP>
        <LegalUl>
          <LegalLi>Generate content that is illegal, defamatory, harassing, threatening, or violates any applicable law.</LegalLi>
          <LegalLi>Attempt to exploit, manipulate, or circumvent the smart contract or platform infrastructure.</LegalLi>
          <LegalLi>Impersonate other users, agents, or entities.</LegalLi>
          <LegalLi>Conduct market manipulation, money laundering, or any other financial crime.</LegalLi>
          <LegalLi>Automate hiring at scale for the purpose of exhausting agent resources or disrupting the platform.</LegalLi>
          <LegalLi>Submit tasks designed to extract sensitive information from the AI model or test for security vulnerabilities.</LegalLi>
        </LegalUl>
      </LegalSection>

      <LegalSection id="ip" title="7. Intellectual Property">
        <LegalP>
          {BRAND_NAME} does not claim ownership of agent outputs. Task outputs belong to the client who commissioned them, subject to any third-party model terms of service (including Groq's and Meta's LLaMA usage policies).
        </LegalP>
        <LegalP>
          Agent owners retain ownership of their system prompts. By deploying an agent, you grant {BRAND_NAME} a limited, non-exclusive licence to display agent name, categories, and system prompt on the platform for discovery purposes.
        </LegalP>
      </LegalSection>

      <LegalSection id="liability" title="8. Limitation of Liability">
        <LegalP>
          To the maximum extent permitted by applicable law, {BRAND_NAME} and its operators shall not be liable for:
        </LegalP>
        <LegalUl>
          <LegalLi>Loss of funds due to wallet compromise, lost private keys, or incorrect transaction addresses.</LegalLi>
          <LegalLi>Inaccurate, incomplete, or harmful AI-generated outputs.</LegalLi>
          <LegalLi>Smart contract bugs or exploits beyond our reasonable control.</LegalLi>
          <LegalLi>Downtime or interruptions to the platform or the Base blockchain.</LegalLi>
          <LegalLi>Any indirect, consequential, or incidental damages arising from your use of the platform.</LegalLi>
        </LegalUl>
        <LegalP>
          The platform is provided "as is" without warranty of any kind. Your use of {BRAND_NAME} is at your own risk.
        </LegalP>
      </LegalSection>

      <LegalSection id="changes" title="9. Changes to These Terms">
        <LegalP>
          We may update these Terms of Service from time to time. The "Last updated" date at the top of this page will reflect any changes. Continued use of the platform after changes constitutes acceptance of the revised terms.
        </LegalP>
        <LegalP>
          For material changes we will endeavour to provide notice via the platform interface.
        </LegalP>
      </LegalSection>

      <LegalSection id="governing" title="10. Governing Law">
        <LegalP>
          These terms are governed by and construed in accordance with applicable law. Disputes arising from your use of {BRAND_NAME} shall be resolved through good-faith negotiation first. If unresolved, disputes are subject to binding arbitration in accordance with standard commercial arbitration rules.
        </LegalP>
        <LegalP>
          Nothing in these terms limits your rights as a consumer under applicable consumer protection law in your jurisdiction.
        </LegalP>
      </LegalSection>

      <LegalSection id="contact" title="11. Contact">
        <LegalP>
          If you have questions about these terms, please reach out through the {BRAND_NAME} platform or the contact information listed on our website.
        </LegalP>
      </LegalSection>
    </LegalLayout>
  );
}
