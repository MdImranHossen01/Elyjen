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

async function seed() {
  loadEnvFile();
  const mongoUri = process.env.MONGODB_URI;
  const domain = "elyjen.shop";

  if (!mongoUri) throw new Error("MONGODB_URI is missing in .env.local");

  console.log("Connecting to MongoDB...");
  await mongoose.connect(mongoUri, { bufferCommands: false });
  const db = mongoose.connection.db;

  const categoriesCollection = db.collection("categories");
  const productsCollection = db.collection("products");

  const CATEGORIES = [
    { name: "Running Performance", slug: "running-performance", image: "/assets/sneakers/category/running_category_img_1778514795363.webp" },
    { name: "Basketball Elite", slug: "basketball-elite", image: "/assets/sneakers/category/basketball_category_img_1778514813213.webp" },
    { name: "Casual Essentials", slug: "casual-essentials", image: "/assets/sneakers/category/casual_category_img_1778514829542.webp" },
    { name: "High-Top Classics", slug: "high-top-classics", image: "/assets/sneakers/category/hightop_category_img_1778514862450.webp" },
    { name: "Athletic Trainers", slug: "athletic-trainers", image: "/assets/sneakers/category/athletic_category_img_1778514880292.webp" },
    { name: "Luxury Lifestyle", slug: "luxury-lifestyle", image: "/assets/sneakers/category/luxury_category_img_1778514902191.webp" },
    { name: "Outdoor Trail", slug: "outdoor-trail", image: "/assets/sneakers/category/outdoor_category_img_1778514929995.webp" },
    { name: "Limited Edition", slug: "limited-edition", image: "/assets/sneakers/category/limited_category_img_1778514961650.webp" },
    { name: "Walking Comfort", slug: "walking-comfort", image: "/assets/sneakers/category/walking_category_img_1778514983328.webp" },
    { name: "Skateboarding Pro", slug: "skateboarding-pro", image: "/assets/sneakers/category/Skateboarding Pro.webp" },
  ];

  const IMAGES = [
    "elyjen_elite_sneakers_batch_1_1778584088477.webp",
    "elyjen_flash_sale_batch_2_3_1778584394497.webp",
    "elyjen_flash_sale_sneakers_batch_1_1778584111392.webp",
    "elyjen_heritage_hightop_individual_1778584646796.webp",
    "elyjen_individual_elite_x1_1778584506340.webp",
    "elyjen_individual_speedrunner_pro_1778584523692.webp",
    "elyjen_individual_trailblazer_xt_1778584560058.webp",
    "elyjen_individual_urban_suede_1778584541869.webp",
    "elyjen_new_arrival_batch_2_3_4_5_1778584415319.webp",
    "elyjen_outdoor_trail_sneakers_batch_1_1778584161046.webp",
    "elyjen_primeknit_prism_individual_1778584685121.webp",
    "elyjen_sneakers_mixed_batch_2_1778584185995.webp",
    "elyjen_solar_glide_individual_1778584629722.webp",
    "elyjen_standard_series_mega_batch_1_8_1778584440791.webp",
    "elyjen_stealth_midnight_individual_1778584614020.webp",
    "elyjen_urban_glide_sneakers_batch_1_1778584139507.webp",
    "featured_1_carbon_fiber_running_1778541531171.webp",
    "featured_2_basketball_elite_1778541545796.webp",
    "featured_3_mesh_trainer_1778541560320.webp",
    "featured_4_marathon_shoe_1778541575255.webp",
    "featured_5_designer_leather_1778541588720.webp",
    "featured_6_skateboarding_shoe_1778541605531.webp",
    "featured_7_cross_trainer_1778541620689.webp",
    "featured_8_knit_sneaker_prism_1778541637121.webp",
    "featured_sneaker_1_carbon_fiber_1778540537854.webp",
    "featured_sneaker_2_basketball_elite_1778540553041.webp",
    "skate_category_img_new_1778540384573.webp"
  ];

  console.log("CLEANING DATABASE FOR ELYJEN...");
  await productsCollection.deleteMany({ domain });
  await categoriesCollection.deleteMany({ domain });

  console.log("Seeding categories...");
  const categoryDocs = CATEGORIES.map(cat => ({
    ...cat,
    isActive: true,
    domain,
    createdAt: new Date(),
    updatedAt: new Date()
  }));

  const catResult = await categoriesCollection.insertMany(categoryDocs);
  const catMap = {};
  Object.keys(catResult.insertedIds).forEach((index) => {
    catMap[CATEGORIES[index].slug] = catResult.insertedIds[index];
  });

  const products = [];

  const getRandomImages = (count = 3) => {
    const shuffled = [...IMAGES].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count).map(img => `/assets/sneakers/product/${img}`);
  };

  // --- 10 FEATURED PRODUCTS ---
  for (let i = 0; i < 10; i++) {
    products.push({
      name: `Elyjen Carbon Pro X${i + 1} - Elite Series`,
      slug: `elyjen-carbon-pro-x${i + 1}-${Math.random().toString(36).substring(7)}`,
      description: `Experience the pinnacle of footwear engineering with the Carbon Pro X${i + 1}. Featuring our proprietary responsive foam and a breathable mesh upper, these sneakers are designed for those who demand excellence in every step.`,
      price: 18500 + (i * 500),
      purchasePrice: 12000,
      sku: `EJ-FEAT-${i + 1}-${Date.now()}`,
      stock: 50,
      categories: [catMap['running-performance'], catMap['luxury-lifestyle']],
      images: getRandomImages(Math.floor(Math.random() * 3) + 2), // 2-4 images
      isFeatured: true,
      isNewArrival: false,
      isFlashSale: false,
      isPublished: true,
      domain,
      ratings: 4.8,
      numReviews: 24 + i,
      attributes: [{ key: 'Technology', value: 'Carbon Plate' }, { key: 'Material', value: 'PrimeKnit' }],
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  // --- 10 FLASH SALE PRODUCTS ---
  for (let i = 1; i <= 10; i++) {
    const originalPrice = 12500 + (i * 300);
    products.push({
      name: `SpeedBurst Runner S${i} - Flash Deal`,
      slug: `speedburst-runner-s${i}-${Math.random().toString(36).substring(7)}`,
      description: `Catch the SpeedBurst Runner S${i} at an unbeatable price! Engineered for speed and agility, these trainers offer maximum energy return and a lockdown fit. Don't miss out on this limited-time offer for the ultimate performance gear.`,
      price: originalPrice,
      salePrice: Math.floor(originalPrice * 0.6),
      purchasePrice: 5000,
      sku: `EJ-FLASH-${i}-${Date.now()}`,
      stock: 30,
      categories: [catMap['athletic-trainers'], catMap['running-performance']],
      images: getRandomImages(Math.floor(Math.random() * 3) + 2), // 2-4 images
      isFeatured: false,
      isNewArrival: false,
      isFlashSale: true,
      isPublished: true,
      domain,
      ratings: 4.5,
      numReviews: 12 + i,
      attributes: [{ key: 'Sale', value: '40% OFF' }, { key: 'Fit', value: 'Sock-like' }],
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  // --- 10 NEW ARRIVAL PRODUCTS ---
  for (let i = 1; i <= 10; i++) {
    products.push({
      name: `Urban Glide V${i} - 2026 Edition`,
      slug: `urban-glide-v${i}-${Math.random().toString(36).substring(7)}`,
      description: `Introducing the Urban Glide V${i}, the latest addition to our 2026 collection. Merging futuristic aesthetics with day-long comfort, these sneakers are the perfect companion for your city adventures. Be the first to own the next generation of style.`,
      price: 14500 + (i * 200),
      purchasePrice: 8500,
      sku: `EJ-NEW-${i}-${Date.now()}`,
      stock: 100,
      categories: [catMap['casual-essentials'], catMap['luxury-lifestyle']],
      images: getRandomImages(Math.floor(Math.random() * 3) + 2), // 2-4 images
      isFeatured: false,
      isNewArrival: true,
      isFlashSale: false,
      isPublished: true,
      domain,
      ratings: 4.9,
      numReviews: 5 + i,
      attributes: [{ key: 'Collection', value: 'Spring 2026' }, { key: 'Weight', value: 'Ultra-light' }],
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  // --- 20 GENERAL PRODUCTS ---
  for (let i = 1; i <= 20; i++) {
    const cats = Object.values(catMap);
    const catId = cats[i % cats.length];
    products.push({
      name: `Elyjen Standard Series #${i}`,
      slug: `elyjen-std-${i}-${Math.random().toString(36).substring(7)}`,
      description: `The Elyjen Standard Series #${i} offers the perfect balance of durability, style, and value. Built with high-quality materials and our standard comfort technology, these sneakers are suitable for daily wear and light athletic activities.`,
      price: 8500 + (i * 100),
      purchasePrice: 4500,
      sku: `EJ-STD-${i}-${Date.now()}`,
      stock: 200,
      categories: [catId],
      images: getRandomImages(Math.floor(Math.random() * 3) + 2), // 2-4 images
      isFeatured: false,
      isNewArrival: false,
      isFlashSale: false,
      isPublished: true,
      domain,
      ratings: 4.2,
      numReviews: 40 + i,
      attributes: [{ key: 'Series', value: 'Essential' }],
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  console.log("Seeding products...");
  await productsCollection.insertMany(products);

  console.log(`Successfully seeded ELYJEN database with 50 products using real assets for domain: ${domain}`);
  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error("Seeding failed:", error);
  try { await mongoose.disconnect(); } catch { }
  process.exit(1);
});
