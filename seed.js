const mongoose = require("mongoose");
require("dotenv").config();
const Order = require("./models/Order"); // Adjust path

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB Connected"))
.catch((err) => console.error("❌ MongoDB Connection Failed:", err));

const sampleProductIds = [
  "685c174362743581ae98fd03",
  "685c194262743581ae98fe5a",
  "685c196862743581ae98fe5f",
  "685c201ac51ec59ea5edbdd9"
];

const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const getRandomDate = () => {
  const start = new Date(2023, 0, 1).getTime();
  const end = Date.now();
  return new Date(randomBetween(start, end));
};

const getRandomItem = () => {
  const numItems = randomBetween(1, 5);
  const items = [];
  for (let i = 0; i < numItems; i++) {
    const productId = sampleProductIds[randomBetween(0, sampleProductIds.length - 1)];
    const quantity = randomBetween(1, 3);
    const price = randomBetween(5, 100);
    items.push({ productId, quantity, price });
  }
  return items;
};

const getTotalAmount = (items) => items.reduce((sum, item) => sum + item.quantity * item.price, 0);

const generateOrder = (i) => {
  const items = getRandomItem();
  const createdAt = getRandomDate();
  return {
    orderId: `OD-${String(i + 1).padStart(6, "0")}`,
    userId: "6857fa1885aedfa8a54e46ce",
    items,
    totalAmount: getTotalAmount(items),
    status: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"][randomBetween(0, 4)],
    addresses: [
      {
        label: "Home",
        street: "",
        city: "",
        state: "",
        pincode: "",
        country: "India",
        landmark: "",
        isDefault: false,
        location: { lat: 0, lng: 0 }
      }
    ],
    paymentMode: ["Cash on Delivery", "Online"][randomBetween(0, 1)],
    paymentStatus: ["Paid", "Pending"][randomBetween(0, 1)],
    createdAt,
    updatedAt: createdAt,
  };
};

const seedOrders = async () => {
  const TOTAL = 500000; // 5 lakh
  const BATCH_SIZE = 5000;

  try {
    console.log("🧹 Deleting existing orders...");
    await Order.deleteMany({});

    console.log(`🚀 Seeding ${TOTAL} orders in batches of ${BATCH_SIZE}...`);

    for (let i = 0; i < TOTAL; i += BATCH_SIZE) {
      const batch = [];
      for (let j = 0; j < BATCH_SIZE; j++) {
        const index = i + j;
        batch.push(generateOrder(index));
      }
      await Order.insertMany(batch);
      console.log(`✅ Inserted ${i + BATCH_SIZE} / ${TOTAL}`);
    }

    console.log("🎉 Done! All 500,000 orders seeded.");
  } catch (err) {
    console.error("❌ Seeding failed:", err);
  } finally {
    mongoose.disconnect();
  }
};

seedOrders();
