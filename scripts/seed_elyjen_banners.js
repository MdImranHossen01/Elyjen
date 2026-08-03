const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title: String,
  subtitle: String,
  image: String,
  domain: String,
  isActive: Boolean,
  order: Number
});

const Banner = mongoose.models.Banner || mongoose.model('Banner', bannerSchema);

async function seedElyjenBanners() {
  const uri = "mongodb+srv://Elyjen:MgOFiB9OAFTStmu7@cluster0.e5n1hnl.mongodb.net/Elyjen";
  const domain = "elyjen.shop";
  
  try {
    await mongoose.connect(uri);
    console.log("Connected to ELYJEN MongoDB.");

    const professionalTitles = [
      "ULTIMATE PERFORMANCE GEAR",
      "ICONIC STREETWEAR REBORN",
      "LIMITED EDITION RELEASES",
      "ELEVATE YOUR EVERYDAY STYLE",
      "NEXT-GEN FOOTWEAR DESIGN"
    ];

    const images = [
      "https://i.ibb.co/65JGp6P/A-premium-16-9-lifestyle-shot-of-a-limited-edition-designer-sneaker-on-a-modern-pedestal-Positioned.jpg",
      "https://i.ibb.co/xKP4589G/A-rugged-16-9-outdoor-adventure-shot-of-a-trail-sneaker-on-a-rocky-cliff-edge-The-sneaker-is-on-the.jpg",
      "https://i.ibb.co/m5r2YhQ4/A-high-energy-16-9-action-shot-of-a-basketball-player-wearing-vibrant-high-top-sneakers-mid-jump-for.jpg",
      "https://i.ibb.co/4nr9V8FX/organic-product-website-banner.webp",
      "https://i.ibb.co/60jhXHH6/3.webp"
    ];

    // Delete existing elyjen.shop banners to start clean
    await Banner.deleteMany({ domain });
    console.log("Cleared old elyjen.shop banners in the new DB.");

    for (let i = 0; i < professionalTitles.length; i++) {
      await Banner.create({
        title: professionalTitles[i],
        subtitle: "",
        image: images[i],
        domain,
        isActive: true,
        order: i
      });
      console.log(`Created banner ${i+1}: ${professionalTitles[i]}`);
    }

    console.log("Seeding completed successfully in ELYJEN database.");
  } catch (error) {
    console.error("Error seeding banners:", error);
  } finally {
    await mongoose.connection.close();
  }
}

seedElyjenBanners();
