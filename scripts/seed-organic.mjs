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
  const domain = "bd-dukan.com"; 
  
  if (!mongoUri) throw new Error("MONGODB_URI is missing in .env.local");

  console.log("Connecting to MongoDB...");
  await mongoose.connect(mongoUri, { bufferCommands: false });
  const db = mongoose.connection.db;

  const categoriesCollection = db.collection("categories");
  const productsCollection = db.collection("products");

  const CATEGORIES = [
    { name: "Organic Honey", slug: "organic-honey", image: "/assets/organic/cagetory/organic_honey_category_1778344034194.webp" },
    { name: "Natural Oils", slug: "natural-oils", image: "/assets/organic/cagetory/natural_oils_category_1778344059813.webp" },
    { name: "Herbal Medicine", slug: "herbal-medicine", image: "/assets/organic/cagetory/herbal_medicine_category_1778344082037.webp" },
    { name: "Dry Fruits & Nuts", slug: "dry-fruits", image: "/assets/organic/cagetory/dry_fruits_category_1778344105530.webp" },
    { name: "Organic Spices", slug: "organic-spices", image: "/assets/organic/cagetory/organic_spices_category_1778344130003.webp" },
    { name: "Herbal Tea", slug: "organic-tea", image: "/assets/organic/cagetory/herbal_tea_category_1778344158301.webp" },
    { name: "Grains & Seeds", slug: "organic-grains", image: "/assets/organic/cagetory/organic_grains_category_1778344185901.webp" },
    { name: "Fresh Organic Fruits", slug: "organic-fruits", image: "/assets/organic/cagetory/organic_fruits_category_1778344207005.webp" },
    { name: "Natural Skincare", slug: "organic-skincare", image: "/assets/organic/cagetory/organic_skincare_category_1778344233376.webp" },
    { name: "Health Drinks", slug: "health-drinks", image: "/assets/organic/cagetory/health_drinks_category_1778344257804.webp" },
  ];

  console.log("CLEANING DATABASE...");
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

  const rawProducts = [
    // Organic Honey
    { 
      name: "Sundarban Wild Forest Honey", 
      slug: "sundarban-wild-forest-honey", 
      price: 1250, 
      cat: "organic-honey", 
      image: "/assets/organic/products/sundarban_wild_forest_honey_img_1778345403804.webp",
      desc: "Pure, unprocessed honey ethically sourced from the mangrove forests of Sundarbans. This raw honey is known for its distinct multi-floral aroma and potent medicinal properties. It is a natural booster for immunity and energy.",
      features: ["100% Raw and Unfiltered", "Source: Sundarban Mangrove", "Antibacterial Properties"]
    },
    { 
      name: "Organic Black Seed Honey", 
      slug: "black-seed-honey-premium", 
      price: 1450, 
      cat: "organic-honey", 
      image: "/assets/organic/products/black_seed_honey_img_1778345423989.webp",
      desc: "A powerful combination of premium litchi honey and pure Nigella Sativa (Kalo Jira) extract. This blend is traditionally used to improve respiratory health and overall body strength.",
      features: ["Rich in Antioxidants", "Natural Energy Booster", "Great for Respiratory Health"]
    },
    { 
      name: "Natural Litchi Flower Honey", 
      slug: "litchi-flower-honey-natural", 
      price: 750, 
      cat: "organic-honey", 
      image: "/assets/organic/products/litchi_flower_honey_img_1778345442933.webp",
      desc: "Light, sweet, and aromatic honey collected during the litchi flowering season. It has a delicate fruity note that makes it perfect for children and as a natural sweetener for tea.",
      features: ["Fruity Aroma", "Naturally Sweet", "No Added Sugar"]
    },
    { 
      name: "Mustard Flower Honey (Raw)", 
      slug: "mustard-flower-honey-raw", 
      price: 650, 
      cat: "organic-honey", 
      image: "/assets/organic/products/mustard_flower_honey_img_1778345464053.webp",
      desc: "A thick, creamy honey that naturally crystallizes during winter. Collected from organic mustard fields, it is rich in minerals and enzymes that help soothe sore throats.",
      features: ["High Mineral Content", "Pure and Natural", "Traditional Winter Remedy"]
    },
    { 
      name: "Premium Honeycomb (Raw)", 
      slug: "raw-honeycomb-premium", 
      price: 2200, 
      cat: "organic-honey", 
      image: "/assets/organic/products/raw_honeycomb_img_1778345486986.webp",
      desc: "The most authentic way to consume honey. This raw honeycomb contains honey in its purest form, along with beeswax and propolis, providing a unique texture and maximum health benefits.",
      features: ["Contains Propolis & Pollen", "Pure Edible Beeswax", "Directly from the Hive"]
    },

    // Natural Oils
    { 
      name: "Wood Pressed Mustard Oil", 
      slug: "wood-pressed-mustard-oil", 
      price: 480, 
      cat: "natural-oils", 
      image: "/assets/organic/products/wood_pressed_mustard_oil_img_1778345506999.webp",
      desc: "Traditionally extracted using wooden Ghani (Kather Ghani) at low temperatures to preserve natural nutrients, pungency, and aroma. Perfect for authentic Bengali cooking.",
      features: ["Cold Pressed (Wood)", "No Cholesterol", "High Pungency"]
    },
    { 
      name: "Virgin Coconut Oil (Extra Pure)", 
      slug: "virgin-coconut-oil-pure", 
      price: 550, 
      cat: "natural-oils", 
      image: "/assets/organic/products/virgin_coconut_oil_img_1778345526404.webp",
      desc: "Extracted from fresh coconut kernels, this oil is perfect for both skin care and healthy cooking. It is rich in Lauric acid and Medium Chain Triglycerides (MCTs).",
      features: ["Edible Grade", "Great for Hair & Skin", "Rich in MCTs"]
    },
    { 
      name: "Premium Black Seed Oil", 
      slug: "premium-black-seed-oil", 
      price: 850, 
      cat: "natural-oils", 
      image: "/assets/organic/products/Premium Black Seed Oil.webp",
      desc: "100% pure cold-pressed Nigella Sativa oil. Known as 'The Cure for everything but death', it is a powerful supplement for immunity and skin health.",
      features: ["Cold Pressed", "100% Pure", "Strong Pungency"]
    },
    { 
      name: "Extra Virgin Olive Oil (Organic)", 
      slug: "extra-virgin-olive-oil-org", 
      price: 1100, 
      cat: "natural-oils", 
      image: "/assets/organic/products/Extra Virgin Olive Oil.webp",
      desc: "First cold-pressed olive oil sourced from organic groves. Perfect for salads, light cooking, and skin massage.",
      features: ["Heart Healthy", "High Smoke Point", "Organic Certified"]
    },
    { 
      name: "Pure Sweet Almond Oil", 
      slug: "sweet-almond-oil-pure", 
      price: 950, 
      cat: "natural-oils", 
      image: "/assets/organic/products/Pure Sweet Almond Oil.webp",
      desc: "Nutrient-rich oil extracted from high-quality sweet almonds. Excellent for infant massage, skin hydration, and hair strengthening.",
      features: ["Rich in Vitamin E", "Non-Greasy", "Multipurpose Use"]
    },

    // Herbal Medicine
    { 
      name: "Organic Ashwagandha Powder", 
      slug: "ashwagandha-powder-organic", 
      price: 450, 
      cat: "herbal-medicine", 
      image: "/assets/organic/products/Organic Ashwagandha Powder.webp",
      desc: "Pure Withania Somnifera root powder. A powerful adaptogen that helps the body manage stress, improves sleep quality, and boosts muscle strength.",
      features: ["Stress Relief", "Boosts Vitality", "100% Pure Root"]
    },
    { 
      name: "Pure Moringa Leaf Powder", 
      slug: "moringa-powder-superfood", 
      price: 480, 
      cat: "herbal-medicine", 
      image: "/assets/organic/products/Pure Moringa Leaf Powder.webp",
      desc: "Considered the 'Miracle Tree', our moringa powder is made from shade-dried organic leaves. It contains 7x more Vitamin C than oranges and 4x more Calcium than milk.",
      features: ["Immunity Booster", "Rich in Iron", "Natural Multivitamin"]
    },
    { 
      name: "Triphala Digestive Powder", 
      slug: "triphala-powder-digestive", 
      price: 350, 
      cat: "herbal-medicine", 
      image: "/assets/organic/products/Triphala Digestive Powde.webp",
      desc: "A balanced blend of Amla, Bibhitaki, and Haritaki. This traditional Ayurvedic formula supports colon health and gentle detoxification.",
      features: ["Improves Digestion", "Detoxifies System", "Ayurvedic Classic"]
    },
    { 
      name: "Premium Spirulina Powder", 
      slug: "spirulina-powder-premium", 
      price: 950, 
      cat: "herbal-medicine", 
      image: "/assets/organic/products/Premium Spirulina Powder.webp",
      desc: "A nutrient-dense blue-green algae that provides a massive protein boost and helps combat fatigue. Perfect for smoothies.",
      features: ["High Protein Content", "Energy Booster", "Antioxidant Rich"]
    },
    { 
      name: "Organic Turmeric Capsules", 
      slug: "turmeric-capsules-curcumin", 
      price: 850, 
      cat: "herbal-medicine", 
      image: "/assets/organic/products/Organic Turmeric Capsules.webp",
      desc: "High-absorption turmeric capsules with added black pepper (piperine) to maximize the anti-inflammatory benefits of curcumin.",
      features: ["Joint Support", "Anti-inflammatory", "High Bioavailability"]
    },

    // Dry Fruits
    { 
      name: "Premium Ajwa Dates (Madinah)", 
      slug: "ajwa-dates-madinah", 
      price: 2400, 
      cat: "dry-fruits", 
      image: "/assets/organic/products/Premium Ajwa Dates (Madinah).webp",
      desc: "The most prestigious dates from Madinah. Soft, dark, and rich in nutrients, these dates are known for their unique healing properties.",
      features: ["Soft Texture", "Rich in Iron", "Natural Sweetener"]
    },
    { 
      name: "Roasted Whole Cashew Nuts", 
      slug: "roasted-cashews-premium", 
      price: 1150, 
      cat: "dry-fruits", 
      image: "/assets/organic/products/Roasted Whole Cashew Nuts.webp",
      desc: "Large, crispy roasted cashews with a touch of sea salt. A perfect healthy snack for all ages.",
      features: ["Large Size", "Perfectly Roasted", "High in Protein"]
    },
    { 
      name: "California Shelled Almonds", 
      slug: "california-almonds-shelled", 
      price: 950, 
      cat: "dry-fruits", 
      image: "/assets/organic/products/California Shelled Almonds.webp",
      desc: "Top-grade California almonds, rich in Vitamin E and heart-healthy fats. Great for brain health and glowing skin.",
      features: ["Sweet Taste", "Uniform Size", "Energy Dense"]
    },
    { 
      name: "Premium Walnut Kernels", 
      slug: "walnut-kernels-premium", 
      price: 1600, 
      cat: "dry-fruits", 
      image: "/assets/organic/products/Premium Walnut Kernels.webp",
      desc: "High-quality walnut kernels rich in Omega-3. Essential for brain function and reducing inflammation.",
      features: ["Omega-3 Rich", "Crispy & Fresh", "Brain Food"]
    },
    { 
      name: "Mixed Dry Fruits & Berries", 
      slug: "mixed-dry-fruits-berries", 
      price: 1350, 
      cat: "dry-fruits", 
      image: "/assets/organic/products/Mixed Dry Fruits & Berries.webp",
      desc: "A delicious and healthy mix of almonds, cashews, raisins, cranberries, and pumpkin seeds. The ultimate energy trail mix.",
      features: ["Vitamin Rich", "Perfect Snack", "Diverse Nutrients"]
    },

    // Organic Spices
    { 
      name: "Organic Turmeric Powder", 
      slug: "organic-turmeric-pow-high", 
      price: 220, 
      cat: "organic-spices", 
      image: "/assets/organic/products/organic_turmeric_powder_1778373855826.webp",
      desc: "Sourced from organic farms in Sylhet, this turmeric powder has a high curcumin content and deep natural color. No artificial colors added.",
      features: ["High Curcumin", "Vibrant Color", "Pesticide Free"]
    },
    { 
      name: "Premium Red Chili Powder", 
      slug: "premium-red-chili-pow", 
      price: 260, 
      cat: "organic-spices", 
      image: "/assets/organic/products/premium_red_chili_powder_1778373870948.webp",
      desc: "Naturally dried and ground red chilies providing the perfect balance of heat and flavor for your curry.",
      features: ["Natural Spice", "No Additives", "Deep Red Color"]
    },
    { 
      name: "Whole Black Pepper Corns", 
      slug: "black-pepper-corns-whole", 
      price: 550, 
      cat: "organic-spices", 
      image: "/assets/organic/products/whole_black_pepper_corns_1778373888662.webp",
      desc: "Pungent and aromatic whole black pepper. Perfect for seasoning and traditional medicinal preparations.",
      features: ["Strong Aroma", "Freshly Packed", "Grade A Quality"]
    },
    { 
      name: "Ceylon Cinnamon Sticks", 
      slug: "ceylon-cinnamon-sticks-true", 
      price: 450, 
      cat: "organic-spices", 
      image: "/assets/organic/products/ceylon_cinnamon_sticks_1778373905330.webp",
      desc: "True Ceylon cinnamon from Sri Lanka. Unlike Cassia, it has a sweet aroma and is safe for daily consumption due to low coumarin.",
      features: ["Sweet Aroma", "Low Coumarin", "Thin Quills"]
    },
    { 
      name: "Green Cardamom (Premium Large)", 
      slug: "green-cardamom-premium", 
      price: 1800, 
      cat: "organic-spices", 
      image: "/assets/organic/products/green_cardamom_premium_1778373923019.webp",
      desc: "Selected large green cardamom pods with intense fragrance. Essential for premium tea and desserts.",
      features: ["Intense Aroma", "Green & Large", "Premium Export Quality"]
    },

    // Herbal Tea
    { 
      name: "Organic Green Tea (Pancha-Garh)", 
      slug: "organic-green-tea-pg", 
      price: 450, 
      cat: "organic-tea", 
      image: "/assets/organic/products/organic_green_tea_leaves_1778373944818.webp",
      desc: "Freshly sourced from the highlands of Panchagarh. This green tea is rich in catechins and provides a refreshing metabolic boost.",
      features: ["Rich in Catechins", "Refreshing Taste", "Locally Sourced"]
    },
    { 
      name: "Dried Hibiscus Tea Flowers", 
      slug: "hibiscus-tea-flowers", 
      price: 550, 
      cat: "organic-tea", 
      image: "/assets/organic/products/hibiscus_tea_flowers_1778373966990.webp",
      desc: "Tart and floral dried hibiscus petals. Known for supporting heart health and reducing blood pressure naturally.",
      features: ["Rich in Vitamin C", "Heart Healthy", "Caffeine Free"]
    },
    { 
      name: "Chamomile Flower Tea", 
      slug: "chamomile-tea-flowers", 
      price: 750, 
      cat: "organic-tea", 
      image: "/assets/organic/products/chamomile_flower_tea_1778373983068.webp",
      desc: "Soothing whole chamomile flowers. The perfect bedtime tea for relaxation and improved sleep quality.",
      features: ["Relaxing Effect", "Whole Flowers", "Sleep Support"]
    },
    { 
      name: "Tulsi Ginger Herbal Blend", 
      slug: "tulsi-ginger-herbal-blend", 
      price: 380, 
      cat: "organic-tea", 
      image: "/assets/organic/products/tulsi_ginger_herbal_blend_tea_1778373997289.webp",
      desc: "A warming blend of dried Tulsi (Holy Basil) and Ginger. Excellent for immunity and relief from common cold symptoms.",
      features: ["Immunity Support", "Warming Taste", "Natural Relief"]
    },
    { 
      name: "Ceremonial Matcha Powder", 
      slug: "ceremonial-matcha-pow", 
      price: 1800, 
      cat: "organic-tea", 
      image: "/assets/organic/products/ceremonial_matcha_powder_bowl_1778374016834.webp",
      desc: "Stone-ground green tea powder from Japan. Provides sustained energy and focus without the caffeine jitters.",
      features: ["Superfood", "Energy & Focus", "Vibrant Green"]
    },

    // Grains & Seeds
    { 
      name: "Organic Black Chia Seeds", 
      slug: "black-chia-seeds-organic", 
      price: 750, 
      cat: "organic-grains", 
      image: "/assets/organic/products/organic_black_chia_seeds_jar_1778374038335.webp",
      desc: "Highly nutritious seeds packed with fiber, protein, and Omega-3. Perfect for soaking in water or adding to yogurt.",
      features: ["Fiber Rich", "Omega-3 Packed", "Premium Quality"]
    },
    { 
      name: "Tri-Color Quinoa (Premium)", 
      slug: "tri-color-quinoa-premium", 
      price: 1100, 
      cat: "organic-grains", 
      image: "/assets/organic/products/tri_color_quinoa_bowl_1778374053723.webp",
      desc: "A healthy mix of white, red, and black quinoa. A complete protein source that is easy to cook and delicious.",
      features: ["Complete Protein", "Gluten Free", "Healthy Grain"]
    },
    { 
      name: "Golden Flax Seeds", 
      slug: "golden-flax-seeds-pure", 
      price: 380, 
      cat: "organic-grains", 
      image: "/assets/organic/products/golden_flax_seeds_container_1778374069623.webp",
      desc: "Heart-healthy flax seeds rich in Lignans. Best consumed ground to maximize nutrient absorption.",
      features: ["Heart Healthy", "Rich in Lignans", "Versatile Use"]
    },
    { 
      name: "Aromatic Red Rice (Lal Chal)", 
      slug: "aromatic-red-rice", 
      price: 220, 
      cat: "organic-grains", 
      image: "/assets/organic/products/aromatic_red_rice_jute_bag_1778374084524.webp",
      desc: "Unpolished red rice with the bran intact. Higher in fiber and vitamins compared to white rice.",
      features: ["High Fiber", "Low Glycemic Index", "Rich in B-Vitamins"]
    },
    { 
      name: "Raw Pumpkin Seeds (Pepita)", 
      slug: "raw-pumpkin-seeds", 
      price: 850, 
      cat: "organic-grains", 
      image: "/assets/organic/products/raw_pumpkin_seeds_bowl_1778374100018.webp",
      desc: "Zinc-rich green pumpkin kernels. Great for boosting prostate health and improving sleep quality.",
      features: ["Rich in Zinc", "Healthy Snack", "Energy Boosting"]
    },

    // Organic Fruits
    { 
      name: "Naturally Ripened Banana", 
      slug: "natural-banana-organic", 
      price: 150, 
      cat: "organic-fruits", 
      image: "/assets/organic/products/naturally_ripened_banana_bunch_1778374121594.webp",
      desc: "Sweet and creamy bananas ripened without any harmful chemicals or carbide. Safe for children and everyone.",
      features: ["Chemical Free", "Naturally Ripened", "Rich in Potassium"]
    },
    { 
      name: "Premium Green Apples", 
      slug: "green-apples-crisp", 
      price: 380, 
      cat: "organic-fruits", 
      image: "/assets/organic/products/premium_green_apples_fresh_1778374139017.webp",
      desc: "Tart and juicy green apples sourced from organic orchards. High in fiber and great for digestion.",
      features: ["Crisp Texture", "Tart Flavor", "High Fiber"]
    },
    { 
      name: "Sweet Nagpur Oranges", 
      slug: "sweet-nagpur-oranges", 
      price: 320, 
      cat: "organic-fruits", 
      image: "/assets/organic/products/Sweet Nagpur Oranges.webp",
      desc: "Juicy and vibrant oranges packed with natural Vitamin C. Perfect for fresh morning juice.",
      features: ["Vitamin C Rich", "Juicy & Sweet", "Fresh Picked"]
    },
    { 
      name: "Organic Red Pomegranate", 
      slug: "red-pomegranate-organic", 
      price: 550, 
      cat: "organic-fruits", 
      image: "/assets/organic/products/Organic Red Pomegranate.webp",
      desc: "Premium pomegranates with deep red seeds. Known as a super-fruit for heart health and blood purification.",
      features: ["Blood Booster", "Antioxidant Rich", "Sweet Seeds"]
    },
    { 
      name: "Fresh Dragon Fruit", 
      slug: "fresh-dragon-fruit-pink", 
      price: 750, 
      cat: "organic-fruits", 
      image: "/assets/organic/products/Fresh Dragon Fruit.webp",
      desc: "Exotic dragon fruit rich in prebiotic fiber and antioxidants. Low calorie and very healthy.",
      features: ["Prebiotic Fiber", "Low Calorie", "Stunning Color"]
    },

    // Natural Skincare
    { 
      name: "Pure Aloe Vera Gel (Organic)", 
      slug: "aloe-vera-gel-organic-pure", 
      price: 480, 
      cat: "organic-skincare", 
      image: "/assets/organic/products/Pure Aloe Vera Gel.webp",
      desc: "Multipurpose soothing gel extracted from fresh aloe leaves. Excellent for soothing sunburns, hydrating skin, and hair conditioning.",
      features: ["99% Pure Aloe", "No Artificial Color", "Soothing Effect"]
    },
    { 
      name: "Multani Mitti (Fuller's Earth)", 
      slug: "multani-mitti-natural", 
      price: 180, 
      cat: "organic-skincare", 
      image: "/assets/organic/products/Multani Mitti (Fuller's Earth).webp",
      desc: "Traditional clay for deep skin cleansing. Removes excess oil, fights acne, and provides a natural glow.",
      features: ["Deep Cleansing", "Oil Control", "Natural Glow"]
    },
    { 
      name: "Distilled Rose Water Mist", 
      slug: "rose-water-mist-distilled", 
      price: 280, 
      cat: "organic-skincare", 
      image: "/assets/organic/products/Distilled Rose Water Mist.webp",
      desc: "Hydrating rose water produced through steam distillation. A perfect natural toner and facial refresher.",
      features: ["Natural Toner", "Alcohol Free", "Sweet Fragrance"]
    },
    { 
      name: "Organic Neem Leaf Face Pack", 
      slug: "neem-face-pack-organic", 
      price: 350, 
      cat: "organic-skincare", 
      image: "/assets/organic/products/Organic Neem Face Pack.webp",
      desc: "Effective antibacterial face pack made from organic neem leaves. Helps clear acne, blemishes, and skin irritations.",
      features: ["Antibacterial", "Fights Acne", "100% Herbal"]
    },
    { 
      name: "Unrefined Shea Butter", 
      slug: "unrefined-shea-butter-pure", 
      price: 950, 
      cat: "organic-skincare", 
      image: "/assets/organic/products/Unrefined Shea Butter.webp",
      desc: "Raw, unrefined shea butter from Ghana. The ultimate moisturizer for very dry skin, stretch marks, and eczema.",
      features: ["Intense Moisture", "Raw & Unrefined", "Vitamin A & E"]
    },

    // Health Drinks
    { 
      name: "Apple Cider Vinegar with Mother", 
      slug: "acv-mother-organic-pure", 
      price: 850, 
      cat: "health-drinks", 
      image: "/assets/organic/products/Apple Cider Vinegar (Mother).webp",
      desc: "Raw, unfiltered, and organic apple cider vinegar containing the 'Mother'. Supports weight management and digestive health.",
      features: ["Raw & Unfiltered", "Contains Mother", "Aids Weight Loss"]
    },
    { 
      name: "Natural Pomegranate Juice", 
      slug: "natural-pomegranate-juice-pure", 
      price: 450, 
      cat: "health-drinks", 
      image: "/assets/organic/products/Natural Pomegranate Juice.webp",
      desc: "100% pure pomegranate juice with no added water, sugar, or preservatives. Cold pressed for maximum nutrients.",
      features: ["Cold Pressed", "No Added Sugar", "Heart Healthy"]
    },
    { 
      name: "Digestive Aloe Vera Juice", 
      slug: "aloe-vera-juice-digestive", 
      price: 550, 
      cat: "health-drinks", 
      image: "/assets/organic/products/Digestive Aloe Vera Juice.webp",
      desc: "Pure aloe vera juice with fiber. Helps in soothing the digestive tract and regularizing bowel movements.",
      features: ["Gut Support", "Fiber Included", "Natural Detox"]
    },
    { 
      name: "Pure Amla Vitamin C Juice", 
      slug: "amla-juice-vit-c", 
      price: 420, 
      cat: "health-drinks", 
      image: "/assets/organic/products/Pure Amla Vitamin C Juice.webp",
      desc: "Powerful Vitamin C booster made from fresh Indian gooseberries. Great for hair health and immunity.",
      features: ["Immunity Booster", "Hair Health", "Vitamin C Rich"]
    },
    { 
      name: "Creamy Organic Soy Milk", 
      slug: "creamy-organic-soy-milk", 
      price: 650, 
      cat: "health-drinks", 
      image: "/assets/organic/products/Creamy Organic Soy Milk.webp",
      desc: "Non-GMO organic soy milk. A high-protein, lactose-free alternative to dairy milk, fortified with vitamins.",
      features: ["Lactose Free", "Plant Protein", "Non-GMO"]
    },
  ];

  console.log("Seeding products...");
  
  const productDocs = rawProducts.map((p, index) => {
    return {
      name: p.name,
      slug: p.slug,
      description: p.desc,
      price: p.price,
      sku: "ORG-" + p.slug.toUpperCase().substring(0, 8) + "-" + index,
      stock: 30 + Math.floor(Math.random() * 70),
      categories: [catMap[p.cat]],
      tags: ["organic", "healthy", "natural", p.cat.split('-')[1]],
      images: [p.image || ("/assets/organic/products/" + p.slug + ".webp")], 
      attributes: [
        { key: "Origin", value: "Bangladesh" },
        { key: "Type", value: "100% Organic" },
        { key: "Packaging", value: "Eco-Friendly" }
      ],
      features: p.features || [],
      isPublished: true,
      ratings: 4.7 + (Math.random() * 0.3),
      numReviews: 40 + Math.floor(Math.random() * 160),
      createdAt: new Date(),
      updatedAt: new Date(),
      domain: domain
    };
  });

  const productResult = await productsCollection.insertMany(productDocs);

  console.log(`Successfully seeded ${Object.keys(productResult.insertedIds).length} professional organic products.`);
  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error("Seeding failed:", error);
  try { await mongoose.disconnect(); } catch { }
  process.exit(1);
});
