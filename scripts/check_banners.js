const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title: String,
  subtitle: String,
  image: String,
  domain: String,
  isActive: Boolean
});

const Banner = mongoose.models.Banner || mongoose.model('Banner', bannerSchema);

async function checkBanners() {
  const uri = "mongodb+srv://BdDukan:9xBC9l2njMJgJ2ox@cluster0.e5n1hnl.mongodb.net/BdDukan";

  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB.");

    const allBanners = await Banner.find({});
    console.log(`Found ${allBanners.length} banners in database:`);

    allBanners.forEach((b, i) => {
      console.log(`${i + 1}. ID: ${b._id} | Title: "${b.title}" | Domain: "${b.domain}" | Active: ${b.isActive}`);
    });

  } catch (error) {
    console.error("Error checking banners:", error);
  } finally {
    await mongoose.connection.close();
  }
}

checkBanners();
