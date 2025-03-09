FROM node:20.11.1-alpine3.19

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Explicitly install TypeScript and ts-node
RUN npm install -g typescript ts-node

# Copy all files
COPY . .

# Debug: List directory structure to see what we have
RUN echo "Contents of root directory:"
RUN ls -la
RUN echo "Contents of src directory:"
RUN ls -la src || echo "src directory not found"

# Create necessary directories if they don't exist
RUN mkdir -p src/middleware

# Create a minimal server.js file (not TypeScript, to avoid compilation issues)
RUN echo "Creating a minimal server.js file"; \
    echo 'const express = require("express");' > src/server.js; \
    echo 'const cors = require("cors");' >> src/server.js; \
    echo 'const app = express();' >> src/server.js; \
    echo 'const port = process.env.PORT || 8080;' >> src/server.js; \
    echo 'app.use(cors({ origin: "*" }));' >> src/server.js; \
    echo 'app.use((req, res, next) => {' >> src/server.js; \
    echo '  res.header("Access-Control-Allow-Origin", "https://e-commerce-checkout-redesign.vercel.app");' >> src/server.js; \
    echo '  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");' >> src/server.js; \
    echo '  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");' >> src/server.js; \
    echo '  res.header("Access-Control-Allow-Credentials", "true");' >> src/server.js; \
    echo '  if (req.method === "OPTIONS") { return res.status(200).end(); }' >> src/server.js; \
    echo '  next();' >> src/server.js; \
    echo '});' >> src/server.js; \
    echo 'app.get("/api/health", (req, res) => {' >> src/server.js; \
    echo '  res.json({ status: "ok" });' >> src/server.js; \
    echo '});' >> src/server.js; \
    echo 'app.get("/api/products", (req, res) => {' >> src/server.js; \
    echo '  const products = [' >> src/server.js; \
    echo '    { _id: "prod1", name: "Office Chair", description: "Premium ergonomic office chair with lumbar support", price: 249.99, stockQuantity: 15, isFeatured: true, imageUrl: "https://via.placeholder.com/400x300/3498db/ffffff?text=Office+Chair" },' >> src/server.js; \
    echo '    { _id: "prod2", name: "Headphones", description: "Wireless noise-cancelling headphones", price: 199.99, stockQuantity: 20, isFeatured: true, imageUrl: "https://via.placeholder.com/400x300/e74c3c/ffffff?text=Headphones" },' >> src/server.js; \
    echo '    { _id: "prod3", name: "Smart Watch", description: "Latest smart watch with health monitoring", price: 329.99, stockQuantity: 10, isFeatured: false, imageUrl: "https://via.placeholder.com/400x300/2ecc71/ffffff?text=Smart+Watch" }' >> src/server.js; \
    echo '  ];' >> src/server.js; \
    echo '  res.json(products);' >> src/server.js; \
    echo '});' >> src/server.js; \
    echo 'app.get("/api/products/featured", (req, res) => {' >> src/server.js; \
    echo '  const products = [' >> src/server.js; \
    echo '    { _id: "prod1", name: "Office Chair", description: "Premium ergonomic office chair with lumbar support", price: 249.99, stockQuantity: 15, isFeatured: true, imageUrl: "https://via.placeholder.com/400x300/3498db/ffffff?text=Office+Chair" },' >> src/server.js; \
    echo '    { _id: "prod2", name: "Headphones", description: "Wireless noise-cancelling headphones", price: 199.99, stockQuantity: 20, isFeatured: true, imageUrl: "https://via.placeholder.com/400x300/e74c3c/ffffff?text=Headphones" }' >> src/server.js; \
    echo '  ];' >> src/server.js; \
    echo '  res.json(products);' >> src/server.js; \
    echo '});' >> src/server.js; \
    echo 'app.get("/api/cart", (req, res) => {' >> src/server.js; \
    echo '  res.json({ items: [] });' >> src/server.js; \
    echo '});' >> src/server.js; \
    echo 'app.listen(port, () => {' >> src/server.js; \
    echo '  console.log(`Server running on port ${port}`);' >> src/server.js; \
    echo '});' >> src/server.js

# List files to verify server.js exists
RUN echo "Verifying server.js exists:"
RUN ls -la src/server.js || echo "server.js still missing"

# Expose port
EXPOSE 8080

# Start the server using node (not ts-node)
CMD ["node", "/app/src/server.js"] 