FROM node:20.11.1-alpine3.19

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Debug: List current directory structure before copying
RUN echo "Contents of current directory before copying:"
RUN ls -la

# Copy all files from the backend directory
COPY . .

# Debug: List current directory structure after copying
RUN echo "Contents of current directory after copying:"
RUN ls -la

# Create src directory if it doesn't exist
RUN mkdir -p /app/src

# Debug: Check if the src directory exists and what's in it
RUN echo "Contents of /app/src directory:"
RUN ls -la /app/src/ || echo "Directory is empty"

# Copy the fallback server file to server.js if server.js doesn't exist
RUN if [ ! -f /app/src/server.js ] && [ -f /app/src/fallback-server.js ]; then \
    echo "Copying fallback-server.js to server.js"; \
    cp /app/src/fallback-server.js /app/src/server.js; \
fi

# If server.js still doesn't exist, create a minimal one
RUN if [ ! -f /app/src/server.js ]; then \
    echo "Creating a minimal server.js file"; \
    echo 'const express = require("express");' > /app/src/server.js; \
    echo 'const cors = require("cors");' >> /app/src/server.js; \
    echo 'const app = express();' >> /app/src/server.js; \
    echo 'const port = process.env.PORT || 8080;' >> /app/src/server.js; \
    echo 'app.use(cors());' >> /app/src/server.js; \
    echo 'app.use(express.json());' >> /app/src/server.js; \
    echo 'const products = [' >> /app/src/server.js; \
    echo '  { _id: "prod1", name: "Ergonomic Office Chair", description: "Premium ergonomic office chair with lumbar support and adjustable height.", price: 249.99, stockQuantity: 15, isFeatured: true, imageUrl: "https://via.placeholder.com/400x300/3498db/ffffff?text=Office+Chair" },' >> /app/src/server.js; \
    echo '  { _id: "prod2", name: "Wireless Noise-Cancelling Headphones", description: "Premium wireless headphones with active noise cancellation and 30-hour battery life.", price: 199.99, stockQuantity: 25, isFeatured: true, imageUrl: "https://via.placeholder.com/400x300/e74c3c/ffffff?text=Headphones" },' >> /app/src/server.js; \
    echo '  { _id: "prod3", name: "Smart Watch Series 5", description: "Latest smart watch with health monitoring, GPS, and waterproof design.", price: 329.99, stockQuantity: 10, isFeatured: false, imageUrl: "https://via.placeholder.com/400x300/2ecc71/ffffff?text=Smart+Watch" },' >> /app/src/server.js; \
    echo '  { _id: "prod4", name: "4K Ultra HD TV - 55 inch", description: "Crystal clear 4K Ultra HD smart TV with HDR and voice control.", price: 599.99, stockQuantity: 8, isFeatured: true, imageUrl: "https://via.placeholder.com/400x300/f39c12/ffffff?text=4K+TV" },' >> /app/src/server.js; \
    echo '  { _id: "prod5", name: "Professional DSLR Camera", description: "High-resolution DSLR camera with 24.2MP sensor and 4K video recording.", price: 899.99, stockQuantity: 5, isFeatured: false, imageUrl: "https://via.placeholder.com/400x300/9b59b6/ffffff?text=DSLR+Camera" }' >> /app/src/server.js; \
    echo '];' >> /app/src/server.js; \
    echo 'app.get("/api/health", (req, res) => { res.json({ status: "ok" }); });' >> /app/src/server.js; \
    echo 'app.get("/api/products", (req, res) => { res.json(products); });' >> /app/src/server.js; \
    echo 'app.get("/api/cart", (req, res) => { res.json({ items: [] }); });' >> /app/src/server.js; \
    echo 'app.get("/api/products/featured", (req, res) => {' >> /app/src/server.js; \
    echo '  const featuredProducts = products.filter(p => p.isFeatured);' >> /app/src/server.js; \
    echo '  res.json(featuredProducts);' >> /app/src/server.js; \
    echo '});' >> /app/src/server.js; \
    echo 'app.get("/api/shipping", (req, res) => {' >> /app/src/server.js; \
    echo '  const shippingOptions = [' >> /app/src/server.js; \
    echo '    { id: "standard", name: "Standard Shipping", price: 5.99, estimatedDays: "3-5 business days" },' >> /app/src/server.js; \
    echo '    { id: "express", name: "Express Shipping", price: 12.99, estimatedDays: "1-2 business days" },' >> /app/src/server.js; \
    echo '    { id: "free", name: "Free Shipping", price: 0, estimatedDays: "5-7 business days" }' >> /app/src/server.js; \
    echo '  ];' >> /app/src/server.js; \
    echo '  res.json(shippingOptions);' >> /app/src/server.js; \
    echo '});' >> /app/src/server.js; \
    echo 'app.get("/api/payment-methods", (req, res) => {' >> /app/src/server.js; \
    echo '  const paymentMethods = [' >> /app/src/server.js; \
    echo '    { id: "credit_card", name: "Credit Card" },' >> /app/src/server.js; \
    echo '    { id: "paypal", name: "PayPal" }' >> /app/src/server.js; \
    echo '  ];' >> /app/src/server.js; \
    echo '  res.json(paymentMethods);' >> /app/src/server.js; \
    echo '});' >> /app/src/server.js; \
    echo 'app.listen(port, () => { console.log(`Server running on port ${port}`); });' >> /app/src/server.js; \
fi

# Ensure the file is executable
RUN chmod +x /app/src/server.js || echo "Failed to make server.js executable"

# Check if server.js exists now
RUN echo "Final check for server.js:"
RUN ls -la /app/src/server.js || echo "server.js still missing"

# Expose port
EXPOSE 8080

# Command to start the application
CMD ["npm", "start"] 