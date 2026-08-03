import fs from "node:fs";
import path from "node:path";

const CATEGORIES = [
  { name: "Men's Clothing", slug: "mens-clothing", image: "/seed/mens.webp" },
  { name: "Women's Clothing", slug: "womens-clothing", image: "/seed/womens.webp" },
  { name: "Kids & Baby", slug: "kids-baby", image: "/seed/kids.webp" },
  { name: "Footwear", slug: "footwear", image: "/seed/footwear.webp" },
  { name: "Fashion Accessories", slug: "fashion-accessories", image: "/seed/accessories.webp" },
  { name: "Bags & Wallets", slug: "bags-wallets", image: "/seed/bags.webp" },
  { name: "Jewelry", slug: "jewelry", image: "/seed/jewelry.webp" },
  { name: "Watches", slug: "watches", image: "/seed/watches.webp" },
  { name: "Beauty & Grooming", slug: "beauty-grooming", image: "/seed/beauty.webp" },
  { name: "Home & Lifestyle", slug: "home-lifestyle", image: "/seed/home.webp" },
];

const rawProducts = [
  // --- Men's Clothing (0-9) ---
  { name: "Signature Oxford Slim-Fit Shirt", slug: "signature-oxford-slim-fit-shirt", price: 2450, sku: "MS-OXF-001", cat: "mens-clothing", img: "/seed/mens_shirt.webp", tags: ["men", "shirt"], desc: "100% premium long-staple cotton." },
  { name: "Heritage Selvedge Denim Jeans", slug: "heritage-selvedge-denim-jeans", price: 4800, sku: "MJ-SEL-002", cat: "mens-clothing", img: "/seed/mens_jeans.webp", tags: ["men", "denim"], desc: "Raw selvedge denim woven on vintage shuttle looms." },
  { name: "Lightweight Merino Wool Sweater", slug: "lightweight-merino-wool-sweater", price: 3200, sku: "MK-MER-003", cat: "mens-clothing", img: "/seed/mens.webp", tags: ["men", "knitwear"], desc: "Ethically sourced Merino wool." },
  { name: "Technical Waterproof Parka", slug: "technical-waterproof-parka", price: 8500, sku: "MO-PAR-004", cat: "mens-clothing", img: "/seed/mens_shirt.webp", tags: ["men", "outerwear"], desc: "High-performance waterproof membrane." },
  { name: "Premium Linen Summer Blazer", slug: "premium-linen-summer-blazer", price: 7200, sku: "MB-LIN-005", cat: "mens-clothing", img: "/seed/mens.webp", tags: ["men", "blazer"], desc: "Breathable Irish linen." },
  { name: "Essential Cotton Crewneck Tee", slug: "essential-cotton-crewneck-tee", price: 950, sku: "MT-ESS-006", cat: "mens-clothing", img: "/seed/mens_shirt.webp", tags: ["men", "basics"], desc: "Heavy-weight Pima cotton." },
  { name: "Stretch Chino Trousers", slug: "stretch-chino-trousers", price: 2800, sku: "MP-CHI-007", cat: "mens-clothing", img: "/seed/mens_jeans.webp", tags: ["men", "trousers"], desc: "Comfort meets class with a touch of elastane." },
  { name: "Vintage Graphic Print Hoodie", slug: "vintage-graphic-print-hoodie", price: 3500, sku: "MH-GRA-008", cat: "mens-clothing", img: "/seed/mens.webp", tags: ["men", "hoodie"], desc: "Vintage-inspired chest graphic." },
  { name: "Italian Leather Belt", slug: "italian-leather-belt", price: 1800, sku: "MA-BEL-009", cat: "mens-clothing", img: "/seed/mens_shirt.webp", tags: ["men", "accessory"], desc: "Full-grain vegetable-tanned Italian leather." },
  { name: "Performance Workout Shorts", slug: "performance-workout-shorts", price: 1500, sku: "MA-WOR-010", cat: "mens-clothing", img: "/seed/mens_jeans.webp", tags: ["men", "activewear"], desc: "Moisture-wicking fabric with four-way stretch." },

  // --- Women's Clothing (10-19) ---
  { name: "Floral Silk Wrap Dress", slug: "floral-silk-wrap-dress", price: 6500, sku: "WD-SIL-011", cat: "womens-clothing", img: "/seed/womens_dress.webp", tags: ["women", "dress"], desc: "100% mulberry silk with hand-painted floral print." },
  { name: "High-Waisted Pleated Trousers", slug: "high-waisted-pleated-trousers", price: 3800, sku: "WP-PLE-012", cat: "womens-clothing", img: "/seed/womens.webp", tags: ["women", "trousers"], desc: "Powerful professional look with a wide-leg silhouette." },
  { name: "Oversized Cashmere Cardigan", slug: "oversized-cashmere-cardigan", price: 9200, sku: "WK-CAS-013", cat: "womens-clothing", img: "/seed/womens_dress.webp", tags: ["women", "knitwear"], desc: "4-ply Mongolian cashmere." },
  { name: "Classic Trench Coat", slug: "classic-trench-coat", price: 11500, sku: "WO-TRE-014", cat: "womens-clothing", img: "/seed/womens.webp", tags: ["women", "outerwear"], desc: "Double-breasted water-resistant cotton gabardine." },
  { name: "Bohemian Embroidered Blouse", slug: "bohemian-embroidered-blouse", price: 2900, sku: "WT-EMB-015", cat: "womens-clothing", img: "/seed/womens_dress.webp", tags: ["women", "blouse"], desc: "Intricate floral embroidery and tassel ties." },
  { name: "Sculpting Yoga Leggings", slug: "sculpting-yoga-leggings", price: 2400, sku: "WA-YOG-016", cat: "womens-clothing", img: "/seed/womens.webp", tags: ["women", "activewear"], desc: "Second-skin feel with compression waist." },
  { name: "Satin Midi Skirt", slug: "satin-midi-skirt", price: 2200, sku: "WS-SAT-017", cat: "womens-clothing", img: "/seed/womens_dress.webp", tags: ["women", "skirt"], desc: "Bias-cut satin skirt drapes beautifully." },
  { name: "Tailored Linen Vest", slug: "tailored-linen-vest", price: 2600, sku: "WT-VES-018", cat: "womens-clothing", img: "/seed/womens.webp", tags: ["women", "vest"], desc: "Structured linen vest for a sophisticated edge." },
  { name: "Classic Denim Jacket", slug: "classic-denim-jacket", price: 3500, sku: "WO-DEN-019", cat: "womens-clothing", img: "/seed/womens_dress.webp", tags: ["women", "denim"], desc: "Slightly cropped fit with antique brass hardware." },
  { name: "Evening Sequin Mini Dress", slug: "evening-sequin-mini-dress", price: 5800, sku: "WD-SEQ-020", cat: "womens-clothing", img: "/seed/womens.webp", tags: ["women", "dress"], desc: "Hand-stitched sequins with a deep V-neck." },

  // --- Kids & Baby (20-29) ---
  { name: "Organic Cotton Baby Onesie", slug: "organic-cotton-baby-onesie", price: 1200, sku: "KB-ONE-021", cat: "kids-baby", img: "/seed/kids_outfit.webp", tags: ["baby", "organic"], desc: "GOTS-certified organic cotton." },
  { name: "Denim Overalls for Kids", slug: "denim-overalls-for-kids", price: 2200, sku: "KC-OVE-022", cat: "kids-baby", img: "/seed/kids_shoes.webp", tags: ["kids", "denim"], desc: "Durable with adjustable straps." },
  { name: "Toddler Canvas Sneakers", slug: "toddler-canvas-sneakers", price: 1800, sku: "KS-SNE-023", cat: "kids-baby", img: "/seed/kids.webp", tags: ["toddler", "shoes"], desc: "Velcro straps and non-slip rubber sole." },
  { name: "Cozy Fleece Bear Hoodie", slug: "cozy-fleece-bear-hoodie", price: 1950, sku: "KC-HOO-024", cat: "kids-baby", img: "/seed/kids_outfit.webp", tags: ["kids", "fleece"], desc: "Cute bear ears on the hood." },
  { name: "Floral Print Cotton Dress", slug: "floral-print-cotton-dress", price: 1600, sku: "KC-DRE-025", cat: "kids-baby", img: "/seed/kids_shoes.webp", tags: ["kids", "dress"], desc: "Breezy cotton with vibrant floral print." },
  { name: "Rainy Day Waterproof Boots", slug: "rainy-day-waterproof-boots", price: 1500, sku: "KS-BOO-026", cat: "kids-baby", img: "/seed/kids.webp", tags: ["kids", "boots"], desc: "100% waterproof rubber boots." },
  { name: "Graphic T-Shirt - Dino Adventure", slug: "graphic-t-shirt-dino-adventure", price: 850, sku: "KT-GRA-027", cat: "kids-baby", img: "/seed/kids_outfit.webp", tags: ["kids", "t-shirt"], desc: "Glow-in-the-dark dinosaur graphic." },
  { name: "Baby Knit Blanket", slug: "baby-knit-blanket", price: 2500, sku: "KB-BLA-028", cat: "kids-baby", img: "/seed/kids_shoes.webp", tags: ["baby", "nursery"], desc: "Hypoallergenic cotton knit." },
  { name: "Striped Swimwear Set", slug: "striped-swimwear-set", price: 1400, sku: "KC-SWI-029", cat: "kids-baby", img: "/seed/kids.webp", tags: ["kids", "swimwear"], desc: "UPF 50+ nautical stripe pattern." },
  { name: "Smart Cotton Button-Up Shirt", slug: "smart-cotton-button-up-shirt", price: 1750, sku: "KC-SHI-030", cat: "kids-baby", img: "/seed/kids_outfit.webp", tags: ["kids", "shirt"], desc: "For little gentlemen." },

  // --- Footwear (30-39) ---
  { name: "Urban Explorer White Sneakers", slug: "urban-explorer-white-sneakers", price: 4500, sku: "FS-SNE-031", cat: "footwear", img: "/seed/sneakers.webp", tags: ["shoes", "sneakers"], desc: "Minimalist leather with memory foam." },
  { name: "Classic Leather Chelsea Boots", slug: "classic-leather-chelsea-boots", price: 7200, sku: "FS-BOO-032", cat: "footwear", img: "/seed/footwear.webp", tags: ["shoes", "boots"], desc: "Top-grain leather with elastic side panels." },
  { name: "Performance Mesh Running Shoes", slug: "performance-mesh-running-shoes", price: 5800, sku: "FS-RUN-033", cat: "footwear", img: "/seed/sneakers.webp", tags: ["shoes", "running"], desc: "Breathable mesh and responsive cushioning." },
  { name: "Pointed Toe Stiletto Heels", slug: "pointed-toe-stiletto-heels", price: 4200, sku: "FS-HEE-034", cat: "footwear", img: "/seed/footwear.webp", tags: ["shoes", "heels"], desc: "Sleek pointed toe with padded footbed." },
  { name: "Casual Suede Loafers", slug: "casual-suede-loafers", price: 4800, sku: "FS-LOA-035", cat: "footwear", img: "/seed/sneakers.webp", tags: ["shoes", "loafers"], desc: "Soft suede with flexible rubber sole." },
  { name: "Handcrafted Wingtip Oxfords", slug: "handcrafted-wingtip-oxfords", price: 8500, sku: "FS-OXF-036", cat: "footwear", img: "/seed/footwear.webp", tags: ["shoes", "formal"], desc: "Intricate brogue detailing." },
  { name: "Rugged Mountain Hiking Boots", slug: "rugged-mountain-hiking-boots", price: 6800, sku: "FS-HIK-037", cat: "footwear", img: "/seed/sneakers.webp", tags: ["shoes", "hiking"], desc: "Waterproof membrane and high-traction sole." },
  { name: "Comfort Foam Sliders", slug: "comfort-foam-sliders", price: 1200, sku: "FS-SLI-038", cat: "footwear", img: "/seed/footwear.webp", tags: ["shoes", "sliders"], desc: "Contoured foam for lightweight cushioning." },
  { name: "Platform Velvet Ankle Boots", slug: "platform-velvet-ankle-boots", price: 5200, sku: "FS-PLA-039", cat: "footwear", img: "/seed/sneakers.webp", tags: ["shoes", "boots"], desc: "Chunky platform with a sleek side zip." },
  { name: "Espadrille Wedge Sandals", slug: "espadrille-wedge-sandals", price: 3600, sku: "FS-SAN-040", cat: "footwear", img: "/seed/footwear.webp", tags: ["shoes", "sandals"], desc: "Jute-wrapped wedge with soft leather strap." },

  // --- Fashion Accessories (40-49) ---
  { name: "Polarized Aviator Sunglasses", slug: "polarized-aviator-sunglasses", price: 2800, sku: "AC-SUN-041", cat: "fashion-accessories", img: "/seed/accessories.webp", tags: ["accessories", "sun"], desc: "Metal frames with polarized lenses." },
  { name: "Silk Twill Square Scarf", slug: "silk-twill-square-scarf", price: 3500, sku: "AC-SCA-042", cat: "fashion-accessories", img: "/seed/accessories.webp", tags: ["accessories", "silk"], desc: "Exclusive geometric print on 100% silk." },
  { name: "Woven Fedora Straw Hat", slug: "woven-fedora-straw-hat", price: 1800, sku: "AC-HAT-043", cat: "fashion-accessories", img: "/seed/accessories.webp", tags: ["accessories", "hat"], desc: "Breathable paper-straw with ribbon band." },
  { name: "Embossed Leather Card Holder", slug: "emphasized-leather-card-holder", price: 1200, sku: "AC-CAR-044", cat: "fashion-accessories", img: "/seed/accessories.webp", tags: ["accessories", "wallet"], desc: "Slim croc-embossed leather." },
  { name: "Knit Wool Beanie", slug: "knit-wool-beanie", price: 950, sku: "AC-BEA-045", cat: "fashion-accessories", img: "/seed/accessories.webp", tags: ["accessories", "winter"], desc: "Chunky-knit wool blend." },
  { name: "Chunky Gold Link Necklace", slug: "chunky-gold-link-necklace", price: 4500, sku: "AC-NEC-046", cat: "fashion-accessories", img: "/seed/accessories.webp", tags: ["jewelry", "necklace"], desc: "18K gold-plated chain statement piece." },
  { name: "Reversible Leather Belt", slug: "reversible-leather-belt", price: 2200, sku: "AC-BEL-047", cat: "fashion-accessories", img: "/seed/accessories.webp", tags: ["accessories", "belt"], desc: "Flips from black to brown." },
  { name: "Velvet Hair Bow Clip", slug: "velvet-hair-bow-clip", price: 650, sku: "AC-BOW-048", cat: "fashion-accessories", img: "/seed/accessories.webp", tags: ["accessories", "hair"], desc: "Oversized velvet bow with metal clip." },
  { name: "Cotton Canvas Tote Bag", slug: "cotton-canvas-tote-bag", price: 800, sku: "AC-TOT-049", cat: "fashion-accessories", img: "/seed/accessories.webp", tags: ["bags", "tote"], desc: "Heavyweight 12oz canvas." },
  { name: "Suede Touchscreen Gloves", slug: "suede-touchscreen-gloves", price: 1950, sku: "AC-GLO-050", cat: "fashion-accessories", img: "/seed/accessories.webp", tags: ["accessories", "winter"], desc: "Conductive fingertips for phone use." },

  // --- Bags & Wallets (50-59) ---
  { name: "Executive Leather Briefcase", slug: "executive-leather-briefcase", price: 12500, sku: "BW-BRI-051", cat: "bags-wallets", img: "/seed/bags.webp", tags: ["bags", "professional"], desc: "Pebble-grain leather with laptop slot." },
  { name: "Quilted Chain Crossbody Bag", slug: "quilted-chain-crossbody-bag", price: 8200, sku: "BW-CRO-052", cat: "bags-wallets", img: "/seed/womens_handbag.webp", tags: ["bags", "luxury"], desc: "Quilted lambskin evening bag." },
  { name: "Urban Roll-Top Backpack", slug: "urban-roll-top-backpack", price: 5500, sku: "BW-BAC-053", cat: "bags-wallets", img: "/seed/bags.webp", tags: ["bags", "backpack"], desc: "Water-resistant nylon for city use." },
  { name: "Continental Zip-Around Wallet", slug: "continental-zip-around-wallet", price: 2400, sku: "BW-WAL-054", cat: "bags-wallets", img: "/seed/bags.webp", tags: ["wallets", "leather"], desc: "12 card slots and zippered coin pouch." },
  { name: "Weekend Canvas Duffle Bag", slug: "weekend-canvas-duffle-bag", price: 6800, sku: "BW-DUF-055", cat: "bags-wallets", img: "/seed/bags.webp", tags: ["travel", "bags"], desc: "Canvas with leather trim and shoe pocket." },
  { name: "Minimalist Bifold Wallet", slug: "minimalist-bifold-wallet", price: 1500, sku: "BW-BIF-056", cat: "bags-wallets", img: "/seed/bags.webp", tags: ["wallets", "men"], desc: "Handcrafted pull-up leather." },
  { name: "Boho Fringe Suede Bag", slug: "boho-fringe-suede-bag", price: 3200, sku: "BW-BHO-057", cat: "bags-wallets", img: "/seed/womens_handbag.webp", tags: ["bags", "suede"], desc: "Bucket bag with playful fringe." },
  { name: "Laptop Sleeve - 14 Inch", slug: "laptop-sleeve-14-inch", price: 1200, sku: "BW-LAP-058", cat: "bags-wallets", img: "/seed/bags.webp", tags: ["tech", "sleeve"], desc: "Faux-fur lining for scratch protection." },
  { name: "Miniature Top-Handle Bag", slug: "miniature-top-handle-bag", price: 2800, sku: "BW-MIN-059", cat: "bags-wallets", img: "/seed/womens_handbag.webp", tags: ["bags", "fashion"], desc: "Structured mini bag for evening." },
  { name: "Anti-Theft Travel Backpack", slug: "anti-theft-travel-backpack", price: 4900, sku: "BW-ANT-060", cat: "bags-wallets", img: "/seed/bags.webp", tags: ["bags", "travel"], desc: "Hidden zippers and RFID blocking." },

  // --- Jewelry (60-69) ---
  { name: "18K Gold Plated Hoop Earrings", slug: "18k-gold-plated-hoop-earrings", price: 2200, sku: "JW-HOO-061", cat: "jewelry", img: "/seed/jewelry.webp", tags: ["jewelry", "gold"], desc: "Classic hoops over sterling silver." },
  { name: "Diamond Solitaire Pendant", slug: "diamond-solitaire-pendant", price: 25000, sku: "JW-PEN-062", cat: "jewelry", img: "/seed/jewelry.webp", tags: ["jewelry", "diamond"], desc: "0.25ct diamond in 14K white gold." },
  { name: "Stacked Bead Bracelet Set", slug: "stacked-bead-bracelet-set", price: 1500, sku: "JW-BRA-063", cat: "jewelry", img: "/seed/jewelry.webp", tags: ["jewelry", "boho"], desc: "Set of five handcrafted bracelets." },
  { name: "Personalized Initial Ring", slug: "personalized-initial-ring", price: 1800, sku: "JW-RIN-064", cat: "jewelry", img: "/seed/jewelry.webp", tags: ["jewelry", "custom"], desc: "Sterling silver with stamped initial." },
  { name: "Vintage Pearl Drop Earrings", slug: "vintage-pearl-drop-earrings", price: 3200, sku: "JW-PEA-065", cat: "jewelry", img: "/seed/jewelry.webp", tags: ["jewelry", "pearl"], desc: "Freshwater pearls on silver filigree." },
  { name: "Statement Chunky Cuff", slug: "statement-chunky-cuff", price: 2800, sku: "JW-CUF-066", cat: "jewelry", img: "/seed/jewelry.webp", tags: ["jewelry", "bracelet"], desc: "Etched tribal pattern on silver." },
  { name: "Layered Celestial Necklace", slug: "layered-celestial-necklace", price: 2400, sku: "JW-CEL-067", cat: "jewelry", img: "/seed/jewelry.webp", tags: ["jewelry", "celestial"], desc: "Moon and star charms with crystals." },
  { name: "Men's Black Onyx Signet Ring", slug: "mens-black-onyx-signet-ring", price: 4500, sku: "JW-SIG-068", cat: "jewelry", img: "/seed/jewelry.webp", tags: ["jewelry", "men"], desc: "Sterling silver with flat-top onyx." },
  { name: "Dainty Snake Chain Anklet", slug: "dainty-snake-chain-anklet", price: 950, sku: "JW-ANK-069", cat: "jewelry", img: "/seed/jewelry.webp", tags: ["jewelry", "anklet"], desc: "Smooth reflective snake chain." },
  { name: "Crystal Teardrop Brooch", slug: "crystal-teardrop-brooch", price: 1200, sku: "JW-BRO-070", cat: "jewelry", img: "/seed/jewelry.webp", tags: ["jewelry", "vintage"], desc: "High-quality glass crystals." },

  // --- Watches (70-79) ---
  { name: "Chronograph Steel Sports Watch", slug: "chronograph-steel-sports-watch", price: 9500, sku: "WA-CHR-071", cat: "watches", img: "/seed/watches.webp", tags: ["watches", "sports"], desc: "42mm steel case, 100m water resistance." },
  { name: "Minimalist Mesh Strap Watch", slug: "minimalist-mesh-strap-watch", price: 5200, sku: "WA-MES-072", cat: "watches", img: "/seed/watches.webp", tags: ["watches", "minimalist"], desc: "Rose gold mesh strap, 36mm dial." },
  { name: "Classic Leather Dress Watch", slug: "classic-leather-dress-watch", price: 4800, sku: "WA-DRE-073", cat: "watches", img: "/seed/watches.webp", tags: ["watches", "formal"], desc: "White enamel dial with Roman numerals." },
  { name: "Automatic Skeleton Watch", slug: "automatic-skeleton-watch", price: 15500, sku: "WA-AUT-074", cat: "watches", img: "/seed/watches.webp", tags: ["watches", "luxury"], desc: "Self-winding mechanical movement." },
  { name: "Smart Fitness Tracker - Pro", slug: "smart-fitness-tracker-pro", price: 3900, sku: "WA-SMA-075", cat: "watches", img: "/seed/watches.webp", tags: ["watches", "fitness"], desc: "Heart rate and sleep tracking." },
  { name: "Pilot's Large Dial Watch", slug: "pilots-large-dial-watch", price: 6400, sku: "WA-PIL-076", cat: "watches", img: "/seed/watches.webp", tags: ["watches", "vintage"], desc: "44mm dial with luminous numerals." },
  { name: "Diamond Bezel Evening Watch", slug: "diamond-bezel-evening-watch", price: 8500, sku: "WA-DIA-077", cat: "watches", img: "/seed/watches.webp", tags: ["watches", "diamond"], desc: "Mother-of-pearl dial with crystals." },
  { name: "Diver's Waterproof Watch", slug: "divers-waterproof-watch", price: 7800, sku: "WA-DIV-078", cat: "watches", img: "/seed/watches.webp", tags: ["watches", "diving"], desc: "Unidirectional bezel, 200m resistance." },
  { name: "Retro Digital Gold Watch", slug: "retro-digital-gold-watch", price: 2200, sku: "WA-RET-079", cat: "watches", img: "/seed/watches.webp", tags: ["watches", "retro"], desc: "Stopwatch, alarm, and calendar." },
  { name: "Titanium Ultra-Light Watch", slug: "titanium-ultra-light-watch", price: 9200, sku: "WA-TIT-080", cat: "watches", img: "/seed/watches.webp", tags: ["watches", "tech"], desc: "Aircraft-grade titanium construction." },

  // --- Beauty (80-89) ---
  { name: "Hyaluronic Acid Glow Serum", slug: "hyaluronic-acid-glow-serum", price: 1800, sku: "BG-SER-081", cat: "beauty-grooming", img: "/seed/beauty.webp", tags: ["skincare", "glow"], desc: "Instant hydration and plumping." },
  { name: "Matte Velvet Lipstick - Ruby Red", slug: "matte-velvet-lipstick-ruby-red", price: 950, sku: "BG-LIP-082", cat: "beauty-grooming", img: "/seed/beauty.webp", tags: ["makeup", "lipstick"], desc: "High-pigment long-wear matte." },
  { name: "Organic Beard Oil - Sandalwood", slug: "organic-beard-oil-sandalwood", price: 1200, sku: "BG-BEA-083", cat: "beauty-grooming", img: "/seed/beauty.webp", tags: ["grooming", "men"], desc: "Condition and tame with argan oil." },
  { name: "Natural Clay Face Mask", slug: "natural-clay-face-mask", price: 1400, sku: "BG-MAS-084", cat: "beauty-grooming", img: "/seed/beauty.webp", tags: ["skincare", "mask"], desc: "French green clay for deep detox." },
  { name: "Nourishing Night Cream", slug: "nourishing-night-cream", price: 2200, sku: "BG-NIG-085", cat: "beauty-grooming", img: "/seed/beauty.webp", tags: ["skincare", "night"], desc: "Overnight repair and moisture lock." },
  { name: "SPF 50 Invisible Sunscreen", slug: "spf-50-invisible-sunscreen", price: 1600, sku: "BG-SUN-086", cat: "beauty-grooming", img: "/seed/beauty.webp", tags: ["skincare", "sun"], desc: "Zero white cast broad-spectrum." },
  { name: "Rose Water Face Mist", slug: "rose-water-face-mist", price: 850, sku: "BG-MIS-087", cat: "beauty-grooming", img: "/seed/beauty.webp", tags: ["skincare", "mist"], desc: "Calm redness and refresh makeup." },
  { name: "Professional Eye Shadow Palette", slug: "professional-eye-shadow-palette", price: 3500, sku: "BG-EYE-088", cat: "beauty-grooming", img: "/seed/beauty.webp", tags: ["makeup", "palette"], desc: "12 highly blendable shades." },
  { name: "Sulfate-Free Strengthening Shampoo", slug: "sulfate-free-strengthening-shampoo", price: 1300, sku: "BG-SHA-089", cat: "beauty-grooming", img: "/seed/beauty.webp", tags: ["haircare", "shampoo"], desc: "Infused with biotin and keratin." },
  { name: "Whipped Shea Body Butter", slug: "whipped-shea-body-butter", price: 1950, sku: "BG-BUT-090", cat: "beauty-grooming", img: "/seed/beauty.webp", tags: ["bodycare", "butter"], desc: "Intensive care for dry skin." },

  // --- Home (90-99) ---
  { name: "Hand-Poured Soy Wax Candle", slug: "hand-poured-soy-wax-candle", price: 1500, sku: "HL-CAN-091", cat: "home-lifestyle", img: "/seed/home.webp", tags: ["home", "candle"], desc: "Clean-burning Jasmine fragrance." },
  { name: "Luxury Egyptian Cotton Towel Set", slug: "luxury-egyptian-cotton-towel-set", price: 4500, sku: "HL-TOW-092", cat: "home-lifestyle", img: "/seed/home.webp", tags: ["home", "bath"], desc: "Set of four plush absorbant towels." },
  { name: "Minimalist Ceramic Coffee Mug", slug: "minimalist-ceramic-coffee-mug", price: 850, sku: "HL-MUG-093", cat: "home-lifestyle", img: "/seed/home.webp", tags: ["home", "kitchen"], desc: "Matte finish handcrafted ceramic." },
  { name: "Weighted Anxiety Blanket", slug: "weighted-anxiety-blanket", price: 8200, sku: "HL-BLA-094", cat: "home-lifestyle", img: "/seed/home.webp", tags: ["home", "wellness"], desc: "15lb blanket for deep pressure sleep." },
  { name: "Smart Indoor Herb Garden", slug: "smart-indoor-herb-garden", price: 5800, sku: "HL-GAR-095", cat: "home-lifestyle", img: "/seed/home.webp", tags: ["home", "garden"], desc: "Automated hydroponic LED system." },
  { name: "Woven Decorative Throw Pillow", slug: "woven-decorative-throw-pillow", price: 1950, sku: "HL-PIL-096", cat: "home-lifestyle", img: "/seed/home.webp", tags: ["home", "decor"], desc: "Hand-woven neutral tassel design." },
  { name: "Insulated Stainless Steel Bottle", slug: "insulated-stainless-steel-bottle", price: 1400, sku: "HL-BOT-097", cat: "home-lifestyle", img: "/seed/home.webp", tags: ["home", "bottle"], desc: "Keeps drinks cold for 24 hours." },
  { name: "Aura Ultrasonic Essential Oil Diffuser", slug: "aura-ultrasonic-essential-oil-diffuser", price: 3200, sku: "HL-DIF-098", cat: "home-lifestyle", img: "/seed/home.webp", tags: ["home", "wellness"], desc: "7 LED color options wood-grain design." },
  { name: "Linen Bed Sheet Set - Queen", slug: "linen-bed-sheet-set-queen", price: 12500, sku: "HL-SHE-099", cat: "home-lifestyle", img: "/seed/home.webp", tags: ["home", "linen"], desc: "100% stonewashed French flax." },
  { name: "Sleek Metal Table Lamp", slug: "sleek-metal-table-lamp", price: 4800, sku: "HL-LAM-100", cat: "home-lifestyle", img: "/seed/home.webp", tags: ["home", "lighting"], desc: "Brushed gold finish dimmable LED." },
];

let dbTsContent = `export const CATEGORIES = [\n`;
for (const cat of CATEGORIES) {
  dbTsContent += `  {\n`;
  dbTsContent += `    name: "${cat.name}",\n`;
  dbTsContent += `    slug: "${cat.slug}",\n`;
  dbTsContent += `    image: "${cat.image}",\n`;
  dbTsContent += `  },\n`;
}
dbTsContent += `];\n\n`;

dbTsContent += `export const PRODUCTS = [\n`;

function generateProductDetails(name, cat) {
  const isClothing = cat.includes("clothing");
  const isShoes = cat === "footwear";
  const isBag = cat === "bags-wallets";
  const isJewelry = cat === "jewelry";
  const isWatch = cat === "watches";
  const isBeauty = cat === "beauty-grooming";

  let desc = `Experience the perfect blend of style and quality with our ${name}. Carefully crafted to meet the highest standards, this piece is designed to elevate your everyday life. `;

  if (isClothing) {
    desc += `Whether you are dressing up for a special occasion or keeping it casual, this garment offers exceptional comfort and a flattering fit. Made from premium, breathable materials, it ensures you stay comfortable throughout the day while looking effortlessly chic.`;
  } else if (isShoes) {
    desc += `Built for both durability and comfort, these shoes feature advanced cushioning and a sturdy sole. Walk with confidence knowing your footwear is designed to support you every step of the way, without compromising on aesthetic appeal.`;
  } else if (isBag) {
     desc += `Spacious and elegantly designed, this bag is your perfect companion. With multiple compartments to keep your essentials organized, it combines practical functionality with a sleek, modern exterior.`;
  } else if (isJewelry || isWatch) {
     desc += `Add a touch of timeless elegance to your collection. This accessory is meticulously detailed and polished to a brilliant shine, making it the perfect statement piece for any outfit or a thoughtful gift for a loved one.`;
  } else if (isBeauty) {
    desc += `Formulated with high-quality, skin-loving ingredients, this product is designed to nourish and enhance your natural beauty. Suitable for all skin types, it delivers visible results with regular use.`;
  } else {
    desc += `Bring a touch of sophistication and utility into your space. Made with premium materials, this product perfectly balances aesthetic design with everyday practicality, making it a must-have.`;
  }

  return desc;
}

rawProducts.forEach((p, index) => {
  let isNewArrival = false;
  let isFlashSale = false;
  let isFeatured = false;
  let discountRate = undefined;
  let salePrice = undefined;

  // Distribute attributes based on index ranges
  if (index < 10) isNewArrival = true;
  else if (index < 20) isFlashSale = true;
  else if (index < 30) isFeatured = true;
  else if (index < 40) {
    discountRate = 10;
    salePrice = Math.floor(p.price * 0.9);
  }
  else if (index < 50) {
    discountRate = 15;
    salePrice = Math.floor(p.price * 0.85);
  }
  else if (index < 60) {
    discountRate = 20;
    salePrice = Math.floor(p.price * 0.8);
  }

  let variants = [];
  if (index < 20) {
    const colors = ["Black", "Navy", "White"];
    const sizes = ["S", "M", "L", "XL"];
    colors.forEach(color => {
      sizes.forEach(size => {
        variants.push({
          color: color,
          size: size,
          price: p.price,
          salePrice: salePrice,
          discountRate: discountRate,
          stock: 5 + Math.floor(Math.random() * 25),
          sku: `${p.sku}-${color.substring(0, 3).toUpperCase()}-${size}`,
          image: p.img
        });
      });
    });
  }

  const fullDescription = p.desc + "\\n\\n" + generateProductDetails(p.name, p.cat);

  dbTsContent += `  {\n`;
  dbTsContent += `    name: "${p.name}",\n`;
  dbTsContent += `    slug: "${p.slug}",\n`;
  dbTsContent += `    description: "${fullDescription}",\n`;
  dbTsContent += `    price: ${p.price},\n`;
  if (salePrice !== undefined) {
    dbTsContent += `    salePrice: ${salePrice},\n`;
    dbTsContent += `    discountRate: ${discountRate},\n`;
  }
  dbTsContent += `    sku: "${p.sku}",\n`;
  dbTsContent += `    stock: 30,\n`; // default static stock for db.ts
  dbTsContent += `    categorySlug: "${p.cat}",\n`;
  dbTsContent += `    images: ["${p.img}"],\n`;
  dbTsContent += `    tags: ${JSON.stringify(p.tags)},\n`;
  dbTsContent += `    variants: ${JSON.stringify(variants)},\n`;
  dbTsContent += `    isPublished: true,\n`;
  if (isNewArrival) dbTsContent += `    isNewArrival: true,\n`;
  if (isFlashSale) dbTsContent += `    isFlashSale: true,\n`;
  if (isFeatured) dbTsContent += `    isFeatured: true,\n`;
  dbTsContent += `  },\n`;
});
dbTsContent += `];\n`;

const targetPath = path.join(process.cwd(), "db.ts");
fs.writeFileSync(targetPath, dbTsContent, "utf8");
console.log("Successfully rewrote db.ts with all distributed attributes.");
