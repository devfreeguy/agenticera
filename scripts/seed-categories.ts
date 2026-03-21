import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const CATEGORIES = [
  {
    name: "Agent Performance Tracking",
    slug: "agent-performance-tracking",
    description: "Monitoring and evaluating the efficiency, accuracy, and overall success metrics of AI agents.",
  },
  {
    name: "API Interaction",
    slug: "api-interaction",
    description: "Integrating with third-party services and executing external LLM or webhook calls.",
  },
  {
    name: "Article Writing",
    slug: "article-writing",
    description: "Drafting comprehensive blog posts, news pieces, and long-form written content.",
  },
  {
    name: "Content Expansion & Rewriting",
    slug: "content-expansion-rewriting",
    description: "Enhancing existing text by fleshing out ideas, improving tone, and rewriting for clarity.",
  },
  {
    name: "Copywriting",
    slug: "copywriting",
    description: "Crafting persuasive marketing copy, landing page text, and promotional materials.",
  },
  {
    name: "Cost Estimation & Token Accounting",
    slug: "cost-estimation-token-accounting",
    description: "Calculating anticipated compute costs and accurately tracking LLM token consumption rates.",
  },
  {
    name: "Data Persistence",
    slug: "data-persistence",
    description: "Managing database operations, long-term storage, and securely saving stateful information.",
  },
  {
    name: "Decision Making",
    slug: "decision-making",
    description: "Autonomously evaluating conditions to accept, reject, or delegate incoming requests.",
  },
  {
    name: "Delegation & Multi-Agent Coordination",
    slug: "delegation-multi-agent-coordination",
    description: "Routing tasks to specialized sub-agents and orchestrating complex swarm workflows.",
  },
  {
    name: "Error Handling & Recovery",
    slug: "error-handling-recovery",
    description: "Detecting pipeline failures, managing exceptions, and executing graceful fallback strategies.",
  },
  {
    name: "Executive Briefing & Strategy",
    slug: "executive-briefing-strategy",
    description: "Generating sharp, structured executive summaries, product briefs, and business overviews.",
  },
  {
    name: "Fact Checking",
    slug: "fact-checking",
    description: "Verifying claims, cross-referencing data points, and ensuring information accuracy.",
  },
  {
    name: "Job Lifecycle Management",
    slug: "job-lifecycle-management",
    description: "Overseeing end-to-end task progression from initial queueing to final delivery.",
  },
  {
    name: "Outline Generation",
    slug: "outline-generation",
    description: "Creating structured content formats, logical skeletons, and document hierarchies.",
  },
  {
    name: "Output Parsing & Validation",
    slug: "output-parsing-validation",
    description: "Ensuring generated responses adhere to strict schemas and pass quality assurance checks.",
  },
  {
    name: "Profitability Analysis",
    slug: "profitability-analysis",
    description: "Evaluating margins, analyzing ROI, and determining the financial viability of operations.",
  },
  {
    name: "Prompt Engineering & Control",
    slug: "prompt-engineering-control",
    description: "Designing, testing, and optimizing system instructions to guarantee desired LLM behaviors.",
  },
  {
    name: "Research",
    slug: "research",
    description: "Conducting deep web searches, gathering academic literature, and analyzing market trends.",
  },
  {
    name: "Resource Optimization",
    slug: "resource-optimization",
    description: "Allocating compute power efficiently and minimizing latency bottlenecks.",
  },
  {
    name: "Retry & Self-Healing Systems",
    slug: "retry-self-healing-systems",
    description: "Automatically resolving transient failures and implementing smart retry mechanisms.",
  },
  {
    name: "Risk Assessment",
    slug: "risk-assessment",
    description: "Identifying potential threats, modeling vulnerabilities, and establishing mitigation plans.",
  },
  {
    name: "Security & Access Control",
    slug: "security-access-control",
    description: "Managing permissions, encrypting sensitive data, and enforcing strict authentication rules.",
  },
  {
    name: "SEO Optimization",
    slug: "seo-optimization",
    description: "Analyzing keywords, improving search rankings, and applying metadata best practices.",
  },
  {
    name: "Smart Contract Interaction",
    slug: "smart-contract-interaction",
    description: "Executing on-chain operations, processing escrow payouts, and handling crypto refunds.",
  },
  {
    name: "Summarization",
    slug: "summarization",
    description: "Distilling long documents, meeting transcripts, and complex articles into concise overviews.",
  },
  {
    name: "Task Execution",
    slug: "task-execution",
    description: "Carrying out actionable, LLM-driven work steps and fulfilling operational prompts.",
  },
  {
    name: "Technical Writing",
    slug: "technical-writing",
    description: "Drafting software documentation, API guides, whitepapers, and instructional manuals.",
  },
  {
    name: "Topic Ideation",
    slug: "topic-ideation",
    description: "Brainstorming creative angles, developing new content themes, and generating concepts.",
  },
  {
    name: "Transaction Logging & Accounting",
    slug: "transaction-logging-accounting",
    description: "Maintaining immutable audit trails, tracking events, and reconciling systemic actions.",
  },
];

async function main() {
  const { prisma } = await import("../src/lib/prisma");

  console.log("🌱 Seeding categories...\n");

  let created = 0;
  let skipped = 0;

  for (const cat of CATEGORIES) {
    const existing = await prisma.category.findUnique({ where: { slug: cat.slug } });

    if (existing) {
      console.log(`⏭️  Skipped (already exists): ${cat.name}`);
      skipped++;
      continue;
    }

    await prisma.category.create({ data: cat });
    console.log(`✅ Created: ${cat.name}`);
    created++;
  }

  console.log(`\n✨ Done. ${created} created, ${skipped} skipped.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
