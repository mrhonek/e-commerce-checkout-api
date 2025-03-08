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

# Create a simple server file if server-ts.ts doesn't exist
RUN if [ ! -f "src/server-ts.ts" ] && [ ! -f "server-ts.ts" ]; then \
    echo "Creating simple server file..." && \
    echo 'import express from "express"; \
    import mongoose from "mongoose"; \
    import cors from "cors"; \
    const app = express(); \
    const port = process.env.PORT || 8080; \
    const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/e-commerce"; \
    mongoose.connect(MONGO_URI) \
      .then(() => console.log("Connected to MongoDB")) \
      .catch(err => console.error("MongoDB connection error:", err)); \
    app.use(cors()); \
    app.use(express.json()); \
    app.get("/api/health", (req, res) => res.json({ status: "ok" })); \
    app.get("/api/products", async (req, res) => { \
      try { \
        const Product = mongoose.model("Product"); \
        const products = await Product.find(); \
        res.json(products); \
      } catch (error) { \
        console.error("Error fetching products:", error); \
        res.status(500).json({ error: "Failed to fetch products" }); \
      } \
    }); \
    app.listen(port, () => console.log(`Server running on port ${port}`));' > src/server-ts.ts; \
fi

# Expose port
EXPOSE 8080

# Try to find any TypeScript server file
RUN find . -type f -name "*server*.ts" | sort || true

# Command to start the application
CMD ["sh", "-c", "if [ -f src/server-ts.ts ]; then \
                   echo 'Starting src/server-ts.ts'; \
                   node --require ts-node/register src/server-ts.ts; \
                 elif [ -f server-ts.ts ]; then \
                   echo 'Starting server-ts.ts'; \
                   node --require ts-node/register server-ts.ts; \
                 elif [ -f src/server.ts ]; then \
                   echo 'Starting src/server.ts'; \
                   node --require ts-node/register src/server.ts; \
                 else \
                   echo 'No server file found, using deploy-bypass.js'; \
                   node deploy-bypass.js; \
                 fi"] 