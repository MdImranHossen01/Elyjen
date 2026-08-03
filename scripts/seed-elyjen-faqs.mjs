import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";

// Load Environment Variables
function loadEnvFile() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

async function seedFAQs() {
  loadEnvFile();
  const mongoUri = process.env.MONGODB_URI;
  const domain = "elyjen.shop"; 
  
  if (!mongoUri) throw new Error("MONGODB_URI is missing in .env.local");

  console.log("Connecting to MongoDB...");
  await mongoose.connect(mongoUri, { bufferCommands: false });
  const db = mongoose.connection.db;

  const faqsCollection = db.collection("faqs");

  const FAQS = [
    {
      question: "Are Elyjen sneakers true to size?",
      answer: "Yes, our sneakers generally run true to size. If you are between sizes, we recommend going with the larger size for the most comfortable fit.",
      order: 1,
      isActive: true,
      domain: domain
    },
    {
      question: "Do you offer international shipping?",
      answer: "Currently, we ship across Bangladesh. We are working on expanding our logistics to support international orders in the near future.",
      order: 2,
      isActive: true,
      domain: domain
    },
    {
      question: "How should I clean my Elyjen performance sneakers?",
      answer: "We recommend hand-washing with mild soap and cold water. Avoid machine washing or drying to preserve the integrity of the carbon plate and specialized foams.",
      order: 3,
      isActive: true,
      domain: domain
    },
    {
      question: "What is your return policy?",
      answer: "We offer a 7-day return policy for unworn sneakers in their original packaging. Please ensure the tags are intact for a smooth return process.",
      order: 4,
      isActive: true,
      domain: domain
    },
    {
      question: "Are Elyjen sneakers suitable for marathon running?",
      answer: "Absolutely! Our 'Elite Series' and 'Carbon Pro' models are specifically engineered with energy-returning carbon plates designed for long-distance performance and marathons.",
      order: 5,
      isActive: true,
      domain: domain
    }
  ];

  console.log(`CLEANING EXISTING FAQS FOR DOMAIN: ${domain}...`);
  await faqsCollection.deleteMany({ domain });

  console.log("Seeding FAQs...");
  const faqDocs = FAQS.map(faq => ({
    ...faq,
    createdAt: new Date(),
    updatedAt: new Date()
  }));

  await faqsCollection.insertMany(faqDocs);

  console.log(`Successfully seeded 5 FAQs for ELYJEN for domain: ${domain}`);
  await mongoose.disconnect();
}

seedFAQs().catch(async (error) => {
  console.error("Seeding failed:", error);
  try { await mongoose.disconnect(); } catch { }
  process.exit(1);
});
