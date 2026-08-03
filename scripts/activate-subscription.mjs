import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";

// Load environment variables from .env.local
function loadEnvFile() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) {
    console.error(".env.local not found!");
    process.exit(1);
  }
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

async function activateSubscription() {
  loadEnvFile();
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error("MONGODB_URI is missing in .env.local");

  console.log("Connecting to database...");
  await mongoose.connect(mongoUri);
  const db = mongoose.connection.db;

  // Get the domain from command line or default to bd-dukan.com
  const domain = process.argv[2] || "bd-dukan.com";
  
  console.log(`Activating subscription for domain: ${domain}...`);

  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 1); // Add 1 year

  const result = await db.collection("globalsettings").updateOne(
    { domain: domain },
    { 
      $set: { 
        "saasSubscription.status": "Active",
        "saasSubscription.expiryDate": futureDate
      } 
    }
  );

  if (result.matchedCount === 0) {
    console.error(`No settings found for domain: ${domain}`);
    // Try to find any record if domain didn't match
    const anyRecord = await db.collection("globalsettings").findOne();
    if (anyRecord) {
      console.log(`Found a record with domain: ${anyRecord.domain}. You might want to try that instead.`);
    }
  } else {
    console.log(`Successfully activated subscription for ${domain}!`);
    console.log(`New expiry date: ${futureDate.toISOString()}`);
  }

  await mongoose.disconnect();
}

activateSubscription().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
