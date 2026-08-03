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

async function checkCount() {
  loadEnvFile();
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error("MONGODB_URI is missing");

  await mongoose.connect(mongoUri);
  const db = mongoose.connection.db;
  
  const productCount = await db.collection("products").countDocuments();
  const categoryCount = await db.collection("categories").countDocuments();
  
  console.log(`--- DATABASE REPORT ---`);
  console.log(`Total Products in DB: ${productCount}`);
  console.log(`Total Categories in DB: ${categoryCount}`);
  
  // Also check some random products
  const samples = await db.collection("products").find().limit(5).toArray();
  console.log(`Sample Product Names:`, samples.map(s => s.name));

  await mongoose.disconnect();
}

checkCount().catch(console.error);
