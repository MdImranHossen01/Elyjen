const mongoose = require('mongoose');

async function checkCollections() {
  const uri = "mongodb+srv://BdDukan:9xBC9l2njMJgJ2ox@cluster0.e5n1hnl.mongodb.net/BdDukan";
  
  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB.");

    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("Collections in database:");
    collections.forEach(c => console.log(`- ${c.name}`));

  } catch (error) {
    console.error("Error checking collections:", error);
  } finally {
    await mongoose.connection.close();
  }
}

checkCollections();
