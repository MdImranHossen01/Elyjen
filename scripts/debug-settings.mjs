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

async function debugSettings() {
  loadEnvFile();
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error("MONGODB_URI is missing");

  await mongoose.connect(mongoUri);
  const db = mongoose.connection.db;
  
  console.log("--- DEBUG GLOBAL SETTINGS ---");
  const settings = await db.collection("globalsettings").find({}).toArray();
  
  settings.forEach(s => {
    console.log(`Domain: ${s.domain}`);
    console.log(`Store ID: ${s.storeId}`);
    console.log(`Status: ${s.saasSubscription?.status}`);
    console.log(`Expiry: ${s.saasSubscription?.expiryDate}`);
    console.log(`Current Server Time: ${new Date().toISOString()}`);
    console.log('---------------------------');
  });

  await mongoose.disconnect();
}

debugSettings().catch(console.error);
