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

# Create a minimal server-ts.ts file if it doesn't exist
RUN if [ ! -f src/server-ts.ts ]; then \
    echo "Creating a minimal server-ts.ts file"; \
    echo 'import express from "express";' > src/server-ts.ts; \
    echo 'import cors from "cors";' >> src/server-ts.ts; \
    echo 'const app = express();' >> src/server-ts.ts; \
    echo 'const port = process.env.PORT || 8080;' >> src/server-ts.ts; \
    echo 'app.use(cors({ origin: "*" }));' >> src/server-ts.ts; \
    echo 'app.use((req, res, next) => {' >> src/server-ts.ts; \
    echo '  res.header("Access-Control-Allow-Origin", "https://e-commerce-checkout-redesign.vercel.app");' >> src/server-ts.ts; \
    echo '  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");' >> src/server-ts.ts; \
    echo '  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");' >> src/server-ts.ts; \
    echo '  res.header("Access-Control-Allow-Credentials", "true");' >> src/server-ts.ts; \
    echo '  if (req.method === "OPTIONS") { return res.status(200).end(); }' >> src/server-ts.ts; \
    echo '  next();' >> src/server-ts.ts; \
    echo '});' >> src/server-ts.ts; \
    echo 'app.get("/api/health", (req, res) => {' >> src/server-ts.ts; \
    echo '  res.json({ status: "ok" });' >> src/server-ts.ts; \
    echo '});' >> src/server-ts.ts; \
    echo 'app.get("/api/products", (req, res) => {' >> src/server-ts.ts; \
    echo '  const products = [' >> src/server-ts.ts; \
    echo '    { _id: "prod1", name: "Office Chair", price: 249.99, isFeatured: true },' >> src/server-ts.ts; \
    echo '    { _id: "prod2", name: "Headphones", price: 199.99, isFeatured: true }' >> src/server-ts.ts; \
    echo '  ];' >> src/server-ts.ts; \
    echo '  res.json(products);' >> src/server-ts.ts; \
    echo '});' >> src/server-ts.ts; \
    echo 'app.get("/api/products/featured", (req, res) => {' >> src/server-ts.ts; \
    echo '  const products = [' >> src/server-ts.ts; \
    echo '    { _id: "prod1", name: "Office Chair", price: 249.99, isFeatured: true },' >> src/server-ts.ts; \
    echo '    { _id: "prod2", name: "Headphones", price: 199.99, isFeatured: true }' >> src/server-ts.ts; \
    echo '  ];' >> src/server-ts.ts; \
    echo '  res.json(products);' >> src/server-ts.ts; \
    echo '});' >> src/server-ts.ts; \
    echo 'app.get("/api/cart", (req, res) => {' >> src/server-ts.ts; \
    echo '  res.json({ items: [] });' >> src/server-ts.ts; \
    echo '});' >> src/server-ts.ts; \
    echo 'app.listen(port, () => {' >> src/server-ts.ts; \
    echo '  console.log(`Server running on port ${port}`);' >> src/server-ts.ts; \
    echo '});' >> src/server-ts.ts; \
fi

# List files to verify server-ts.ts exists
RUN echo "Verifying server-ts.ts exists:"
RUN ls -la src/server-ts.ts || echo "server-ts.ts still missing"

# Expose port
EXPOSE 8080

# Start the TypeScript server with absolute path
CMD ["npx", "ts-node", "/app/src/server-ts.ts"] 