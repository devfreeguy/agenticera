import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const OLD_SLUGS = [
  "content-creation",
  "customer-support",
  "data-analysis",
  "web-scraping",
  "research-summarization",
  "code-generation",
  "code-review-debugging",
  "devops-deployment",
  "task-automation",
  "workflow-orchestration",
  "personal-assistance",
  "scheduling-calendar",
  "email-management",
  "social-media",
  "marketing-seo",
  "sales-leads",
  "finance-accounting",
  "trading-investment",
  "education-tutoring",
  "language-translation",
  "voice-speech",
  "image-generation",
  "video-production",
  "document-processing",
  "knowledge-base",
  "cybersecurity",
  "fraud-detection",
  "gaming-simulation",
  "iot-smart-devices",
  "health-monitoring"
];

async function main() {
  const { prisma } = await import("../src/lib/prisma");

  console.log("🗑️  Removing old categories...");

  try {
    const res = await prisma.category.deleteMany({
      where: {
        slug: {
          in: OLD_SLUGS
        }
      }
    });
    console.log(`✅ Successfully deleted ${res.count} old categories.`);
  } catch (error) {
    console.error("❌ Failed to delete categories:", error);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
