FROM node:20.11.1-alpine3.19

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the entire source code
COPY . .

# Debug: List contents (use || true to prevent failure)
RUN echo "Listing files in /app:" && ls -la || true

# Create src directory if it doesn't exist
RUN mkdir -p src

# Debug: List files in current directory
RUN echo "Files in current directory:" && find . -type f -maxdepth 2 | grep -v "node_modules" || true

# Create a TypeScript-compatible server file if server-ts.ts doesn't exist
RUN if [ ! -f "src/server-ts.ts" ] && [ ! -f "server-ts.ts" ]; then \
    echo "Creating simple server file..." && \
    echo 'import express, { Request, Response } from "express"; \n\
import mongoose from "mongoose"; \n\
import cors from "cors"; \n\
import { Schema } from "mongoose"; \n\
\n\
// Initialize Express app \n\
const app = express(); \n\
const port = process.env.PORT || 8080; \n\
\n\
// MongoDB connection \n\
const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/e-commerce"; \n\
\n\
// Define Product schema if not exists \n\
const createModels = async () => { \n\
  try { \n\
    if (!mongoose.models.Product) { \n\
      const ProductSchema = new Schema({ \n\
        name: String, \n\
        description: String, \n\
        price: Number, \n\
        image: String, \n\
        category: String, \n\
        isFeatured: Boolean, \n\
        featured: Boolean, \n\
        is_featured: Boolean, \n\
        rating: Number, \n\
        reviews: Number, \n\
        stock: Number, \n\
        inStock: Boolean \n\
      }, { timestamps: true }); \n\
      mongoose.model("Product", ProductSchema); \n\
    } \n\
    console.log("Models initialized"); \n\
  } catch (error) { \n\
    console.error("Error creating models:", error); \n\
  } \n\
}; \n\
\n\
// Connect to MongoDB \n\
mongoose.connect(MONGO_URI) \n\
  .then(async () => { \n\
    console.log("Connected to MongoDB"); \n\
    await createModels(); \n\
  }) \n\
  .catch(err => { \n\
    console.error("MongoDB connection error:", err); \n\
  }); \n\
\n\
// Middleware \n\
app.use(cors()); \n\
app.use(express.json()); \n\
\n\
// Routes \n\
app.get("/api/health", (req: Request, res: Response) => { \n\
  res.json({ status: "ok" }); \n\
}); \n\
\n\
app.get("/api/products", async (req: Request, res: Response) => { \n\
  try { \n\
    const Product = mongoose.model("Product"); \n\
    const products = await Product.find(); \n\
    res.json(products); \n\
  } catch (error) { \n\
    console.error("Error fetching products:", error); \n\
    res.status(500).json({ error: "Failed to fetch products" }); \n\
  } \n\
}); \n\
\n\
// Start server \n\
app.listen(port, () => { \n\
  console.log(`Server running on port ${port}`); \n\
}); \n\
\n\
export default app;' > src/server-ts.ts; \
fi

# Expose port
EXPOSE 8080

# Try to find any TypeScript server files
RUN find . -type f -name "*server*.ts" | sort || true

# Command to start the application using npm start
CMD ["npm", "run", "start"] 