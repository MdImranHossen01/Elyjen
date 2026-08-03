const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title: String,
  subtitle: String,
});

const Banner = mongoose.models.Banner || mongoose.model('Banner', bannerSchema);

async function updateBanners() {
  const uri = "mongodb+srv://BdDukan:9xBC9l2njMJgJ2ox@cluster0.e5n1hnl.mongodb.net/BdDukan";
  
  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB.");

    const professionalTitles = [
      "ULTIMATE PERFORMANCE GEAR",
      "ICONIC STREETWEAR REBORN",
      "LIMITED EDITION RELEASES",
      "ELEVATE YOUR EVERYDAY STYLE",
      "NEXT-GEN FOOTWEAR DESIGN"
    ];

    const allBanners = await Banner.find({});
    console.log(`Found ${allBanners.length} banners.`);

    for (let i = 0; i < allBanners.length; i++) {
      const title = professionalTitles[i % professionalTitles.length];
      await Banner.updateOne(
        { _id: allBanners[i]._id },
        { $set: { title: title, subtitle: "" } }
      );
      console.log(`Updated banner ${allBanners[i]._id} with title: ${title}`);
    }

    console.log("Banner updates completed successfully.");
  } catch (error) {
    console.error("Error updating banners:", error);
  } finally {
    await mongoose.connection.close();
  }
}

updateBanners();
