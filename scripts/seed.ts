import crypto from "crypto";
import dotenv from "dotenv";
import path from "path";
import WDK from "@tetherto/wdk";
import WalletManagerEvm from "@tetherto/wdk-wallet-evm";

dotenv.config({ path: path.resolve(__dirname, "../.env") }); // Adjusted to point to your new unified .env

const KEY = process.env.AGENT_ENCRYPTION_KEY!;
const POLYGON_RPC_URL =
  process.env.BASE_RPC_URL || process.env.POLYGON_RPC_URL!; // Works for Base or Polygon

// --- 🏗️ THE UNIVERSAL UTILITY TEMPLATE ---
const UNIVERSAL_PROMPT = (role: string, goal: string) => `
# IDENTITY
You are an autonomous AI Agent specialized in: ${role}.

# OPERATING GOALS
${goal}

# FINANCIAL EVALUATION
- You are paid in crypto on-chain. 
- API Cost is ~$0.001 per 1k tokens.
- You must maintain a 50%+ profit margin. Reject if the task is too large for the reward.

# RESPONSE PROTOCOL
Respond ONLY in JSON. No preamble.
{
  "accept": true,
  "delegate": false,
  "subAgentId": null,
  "subTask": null,
  "mainTask": "Short summary of user request",
  "estimatedCost": number,
  "expectedProfit": number,
  "confidence": number,
  "reason": "Clear and profitable utility task",
  "response": "YOUR ACTUAL WORK GOES HERE"
}
`;

function deriveKey(secret: string): Buffer {
  return crypto.createHash("sha256").update(secret).digest();
}

function encryptSeed(seedPhrase: string, secret: string): string {
  const key = deriveKey(secret);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(seedPhrase, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${ciphertext.toString("hex")}`;
}

async function createAgentWallet() {
  const seedPhrase = WDK.getRandomSeedPhrase();
  const wdk = new WDK(seedPhrase).registerWallet("base", WalletManagerEvm, {
    provider: POLYGON_RPC_URL,
  });
  const account = await wdk.getAccount("base", 0);
  const address = await account.getAddress();
  account.dispose();
  wdk.dispose();
  const encryptedSeed = encryptSeed(seedPhrase, KEY);
  return { address, encryptedSeed };
}

async function main() {
  const { prisma } = await import("../src/lib/prisma");
  const { Role } = await import("../src/generated/prisma/enums");

  console.log("🚀 Starting Fresh Seed Deployment...");

  // 1. RECREATE THE OWNER ACCOUNT (Since the DB is completely empty now)
  const ownerAddress =
    process.env.PLATFORM_BILLING_ADDRESS ||
    "0xA2a4fF50690a06c83786B0FB1eBd07AE4F636B40";
  const owner = await prisma.user.upsert({
    where: { walletAddress: ownerAddress },
    update: {},
    create: { walletAddress: ownerAddress, role: Role.OWNER, onboarded: true },
  });
  console.log(`✅ Admin Account created for: ${ownerAddress}`);

  // 2. CREATE INDEPENDENT CATEGORIES
  console.log("Creating independent categories...");
  const catDev = await prisma.category.create({
    data: { name: "Software Engineering", slug: "software-eng" },
  });
  const catOps = await prisma.category.create({
    data: { name: "Cloud Infrastructure", slug: "cloud-infra" },
  });
  const catDevOps = await prisma.category.create({
    data: { name: "DevOps Automation", slug: "devops-auto" },
  });
  const catWeb3 = await prisma.category.create({
    data: { name: "Web3 Ecosystem", slug: "web3-eco" },
  });
  const catSolidity = await prisma.category.create({
    data: { name: "Smart Contracts", slug: "smart-contracts" },
  });
  const catMarketing = await prisma.category.create({
    data: { name: "Growth Marketing", slug: "growth-marketing" },
  });
  const catAds = await prisma.category.create({
    data: { name: "Advertising & SEO", slug: "ads-seo" },
  });
  const catSec = await prisma.category.create({
    data: { name: "Cybersecurity", slug: "cybersec" },
  });
  const catLegal = await prisma.category.create({
    data: { name: "Legal Tech", slug: "legal-tech" },
  });
  const catComms = await prisma.category.create({
    data: { name: "Corporate Comms", slug: "corp-comms" },
  });
  const catData = await prisma.category.create({
    data: { name: "Data Science", slug: "data-science" },
  });
  const catUx = await prisma.category.create({
    data: { name: "UI/UX Design", slug: "ui-ux" },
  });

  // 3. THE UTILITY FLEET
  const seedAgents = [
    {
      name: "Unit Test Architect",
      cat: [catDev.id],
      price: 5.5,
      role: "Automated Test Generation",
      goal: "Generating comprehensive Vitest/Jest suites for React/Node components.",
    },
    {
      name: "Terraform Titan",
      cat: [catOps.id],
      price: 8.5,
      role: "Infrastructure as Code",
      goal: "Drafting scalable Terraform modules for AWS/GCP.",
    },
    {
      name: "CI/CD Pipeline Master",
      cat: [catDevOps.id],
      price: 6.0,
      role: "GitHub Actions Specialist",
      goal: "Building robust automated testing and deployment workflows.",
    },
    {
      name: "Tokenomics Modeler",
      cat: [catWeb3.id],
      price: 15.0,
      role: "Crypto-Economic Analysis",
      goal: "Simulating token distribution and vesting schedules.",
    },
    {
      name: "Gas Optimizer Pro",
      cat: [catSolidity.id],
      price: 12.0,
      role: "Solidity Refinement",
      goal: "Reducing GWEI consumption by optimizing smart contracts.",
    },
    {
      name: "Viral Thread Creator",
      cat: [catMarketing.id],
      price: 3.0,
      role: "Social Media Strategy",
      goal: "Converting technical content into high-engagement threads.",
    },
    {
      name: "SEO Meta Architect",
      cat: [catAds.id],
      price: 1.5,
      role: "Search Engine Optimization",
      goal: "Crafting high-CTR meta titles and descriptions.",
    },
    {
      name: "Audit Log Sentinel",
      cat: [catSec.id],
      price: 7.0,
      role: "Anomaly Detection",
      goal: "Reviewing raw server logs for security vulnerabilities.",
    },
    {
      name: "ToS Risk Auditor",
      cat: [catLegal.id],
      price: 4.0,
      role: "Legal Doc Summarization",
      goal: "Extracting 'red flag' clauses from complex legal documents.",
    },
    {
      name: "ExecuDraft Pro",
      cat: [catComms.id],
      price: 2.0,
      role: "Professional Email Synthesis",
      goal: "Turning messy notes into polished corporate communication.",
    },
    {
      name: "SQL Performance Tuner",
      cat: [catData.id],
      price: 4.5,
      role: "Query Optimization",
      goal: "Refactoring slow SQL queries for better database efficiency.",
    },
    {
      name: "Tailwind Component Gen",
      cat: [catUx.id],
      price: 3.5,
      role: "Responsive Frontend UI",
      goal: "Building modern React components using Tailwind CSS.",
    },
  ];

  console.log(`Deploying ${seedAgents.length} Agents...`);

  for (const a of seedAgents) {
    const { address, encryptedSeed } = await createAgentWallet();
    await prisma.agent.create({
      data: {
        ownerId: owner.id,
        name: a.name,
        systemPrompt: UNIVERSAL_PROMPT(a.role, a.goal),
        pricePerTask: a.price,
        categoryIds: a.cat,
        walletAddress: address,
        encryptedSeedPhrase: encryptedSeed,
        status: "ACTIVE",
      },
    });
    console.log(`✅ [${a.name}] created.`);
  }

  console.log("✨ Full Database Rebuild Complete.");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
