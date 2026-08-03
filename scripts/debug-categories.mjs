import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";

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

async function debug() {
  loadEnvFile();
  const mongoUri = process.env.MONGODB_URI;
  const domain = "bd-dukan.com";
  
  await mongoose.connect(mongoUri);
  const db = mongoose.connection.db;
  
  const categories = await db.collection("categories").find({ domain }).toArray();
  console.log("Categories for domain:", domain);
  categories.forEach(cat => {
    console.log(`- ${cat.name} (${cat.slug}): ${cat.image}`);
  });
  
  await mongoose.disconnect();
}

debug();
