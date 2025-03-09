import express, { Request, Response } from "express";
import mongoose from "mongoose";
import cors from "cors";
import { Schema } from "mongoose";

// Initialize Express app
const app = express();
const port = process.env.PORT || 8080;

// MongoDB connection
const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/e-commerce";

// Define Product schema if not exists
const createModels = async () => {
  try {
    if (!mongoose.models.Product) {
      const ProductSchema = new Schema({
        name: String,
        description: String,
        price: Number,
        image: String,
        category: String,
        isFeatured: Boolean,
        featured: Boolean,
        is_featured: Boolean,
        rating: Number,
        reviews: Number,
        stock: Number,
        inStock: Boolean
      }, { timestamps: true });
      mongoose.model("Product", ProductSchema);
    }
    console.log("Models initialized");
  } catch (error) {
    console.error("Error creating models:", error);
  }
};

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log("Connected to MongoDB");
    await createModels();
  })
  .catch(err => {
    console.error("MongoDB connection error:", err);
  });

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.get("/api/products", async (req: Request, res: Response) => {
  try {
    const Product = mongoose.model("Product");
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app; 