import dotenv from "dotenv";
import { PrismaClient } from "./src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});

const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🧹 Cleaning up Agent System Prompts...");
  
  const agents = await prisma.agent.findMany();
  
  for (const agent of agents) {
    // This splits the prompt exactly where the JSON formatting started
    // and keeps only the Identity and Goals
    const cleanPrompt = agent.systemPrompt.split("# RESPONSE PROTOCOL")[0].trim();
    
    await prisma.agent.update({
      where: { id: agent.id },
      data: { systemPrompt: cleanPrompt }
    });
    
    console.log(`✅ Cleaned prompt for: ${agent.name}`);
  }

  console.log("✨ All agents updated to purely Identity/Goals.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
