FROM node:20.11.1-alpine3.19

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install
RUN npm install -g typescript ts-node

# Copy ALL files first to ensure we get everything
COPY . .

# Debug: List files to verify structure
RUN echo "Root directory contents:"
RUN ls -la
RUN echo "Files in the current directory:"
RUN find . -type f -maxdepth 1 -name "*.json" | sort
RUN echo "src directory contents (if exists):"
RUN ls -la src || echo "src directory not found"

# Create required directories if they don't exist
RUN mkdir -p src

# Create a basic TypeScript configuration if it doesn't exist
RUN if [ ! -f tsconfig.json ]; then \
    echo "Creating a basic tsconfig.json"; \
    echo '{ "compilerOptions": { "target": "ES2018", "module": "CommonJS", "moduleResolution": "node", "esModuleInterop": true, "resolveJsonModule": true, "allowSyntheticDefaultImports": true, "outDir": "dist", "rootDir": "src", "strict": false, "skipLibCheck": true, "sourceMap": true }, "include": ["src/**/*"], "exclude": ["node_modules", "dist"] }' > tsconfig.json; \
fi

# Create a minimal TypeScript server file if it doesn't exist
RUN if [ ! -f src/server-ts.ts ]; then \
    echo "Creating a minimal server-ts.ts file"; \
    mkdir -p src; \
    echo 'import express from "express";' > src/server-ts.ts; \
    echo 'import cors from "cors";' >> src/server-ts.ts; \
    echo '' >> src/server-ts.ts; \
    echo 'const app = express();' >> src/server-ts.ts; \
    echo 'const port = process.env.PORT || 8080;' >> src/server-ts.ts; \
    echo '' >> src/server-ts.ts; \
    echo '// CORS setup' >> src/server-ts.ts; \
    echo 'app.use(cors({ origin: "*" }));' >> src/server-ts.ts; \
    echo 'app.use(express.json());' >> src/server-ts.ts; \
    echo '' >> src/server-ts.ts; \
    echo '// Add CORS headers directly' >> src/server-ts.ts; \
    echo 'app.use((req: any, res: any, next: any) => {' >> src/server-ts.ts; \
    echo '  res.setHeader("Access-Control-Allow-Origin", "https://e-commerce-checkout-redesign.vercel.app");' >> src/server-ts.ts; \
    echo '  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");' >> src/server-ts.ts; \
    echo '  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");' >> src/server-ts.ts; \
    echo '  res.setHeader("Access-Control-Allow-Credentials", "true");' >> src/server-ts.ts; \
    echo '  if (req.method === "OPTIONS") { return res.status(200).end(); }' >> src/server-ts.ts; \
    echo '  next();' >> src/server-ts.ts; \
    echo '});' >> src/server-ts.ts; \
    echo '' >> src/server-ts.ts; \
    echo '// Sample product data' >> src/server-ts.ts; \
    echo 'const products = [' >> src/server-ts.ts; \
    echo '  { _id: "prod1", name: "Office Chair", price: 249.99, isFeatured: true, imageUrl: "https://via.placeholder.com/400x300/3498db/ffffff?text=Office+Chair" },' >> src/server-ts.ts; \
    echo '  { _id: "prod2", name: "Headphones", price: 199.99, isFeatured: true, imageUrl: "https://via.placeholder.com/400x300/e74c3c/ffffff?text=Headphones" }' >> src/server-ts.ts; \
    echo '];' >> src/server-ts.ts; \
    echo '' >> src/server-ts.ts; \
    echo '// In-memory cart storage' >> src/server-ts.ts; \
    echo 'const cart: { items: any[] } = { items: [] };' >> src/server-ts.ts; \
    echo '' >> src/server-ts.ts; \
    echo '// API endpoints' >> src/server-ts.ts; \
    echo 'app.get("/api/health", (req, res) => res.json({ status: "ok" }));' >> src/server-ts.ts; \
    echo 'app.get("/api/products", (req, res) => res.json(products));' >> src/server-ts.ts; \
    echo 'app.get("/api/products/featured", (req, res) => res.json(products.filter(p => p.isFeatured)));' >> src/server-ts.ts; \
    echo 'app.get("/api/cart", (req, res) => res.json(cart));' >> src/server-ts.ts; \
    echo '' >> src/server-ts.ts; \
    echo '// Start the server' >> src/server-ts.ts; \
    echo 'app.listen(port, () => {' >> src/server-ts.ts; \
    echo '  console.log(`Server running on port ${port}`);' >> src/server-ts.ts; \
    echo '});' >> src/server-ts.ts; \
fi

# Ensure TypeScript dependencies are installed
RUN npm install --save-dev typescript ts-node @types/express @types/cors @types/node

# Final verification
RUN echo "Final verification of files:"
RUN ls -la tsconfig.json
RUN ls -la src/server-ts.ts

# Expose port
EXPOSE 8080

# Start the TypeScript server
CMD ["npx", "ts-node", "src/server-ts.ts"] 