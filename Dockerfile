FROM node:20.11.1-alpine3.19

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all files from the backend directory
COPY . .

# Create src directory if it doesn't exist
RUN mkdir -p src

# Create a temporary file with the server code
RUN echo '// Server code' > /tmp/server.js
RUN echo 'const express = require("express");' >> /tmp/server.js
RUN echo 'const cors = require("cors");' >> /tmp/server.js
RUN echo '' >> /tmp/server.js
RUN echo '// Initialize app' >> /tmp/server.js
RUN echo 'const app = express();' >> /tmp/server.js
RUN echo 'const port = process.env.PORT || 8080;' >> /tmp/server.js
RUN echo '' >> /tmp/server.js
RUN echo '// Middleware' >> /tmp/server.js
RUN echo 'app.use(cors());' >> /tmp/server.js
RUN echo 'app.use(express.json());' >> /tmp/server.js
RUN echo '' >> /tmp/server.js
RUN echo '// Routes' >> /tmp/server.js
RUN echo 'app.get("/api/health", (req, res) => {' >> /tmp/server.js
RUN echo '  res.json({ status: "ok" });' >> /tmp/server.js
RUN echo '});' >> /tmp/server.js
RUN echo '' >> /tmp/server.js
RUN echo '// Shipping routes' >> /tmp/server.js
RUN echo 'app.get("/api/shipping/options", (req, res) => {' >> /tmp/server.js
RUN echo '  console.log("Fetching shipping options");' >> /tmp/server.js
RUN echo '  const shippingOptions = [' >> /tmp/server.js
RUN echo '    { id: "standard", name: "Standard Shipping", description: "3-5 business days", price: 5.99, estimated_days: 5 },' >> /tmp/server.js
RUN echo '    { id: "express", name: "Express Shipping", description: "1-2 business days", price: 14.99, estimated_days: 2 },' >> /tmp/server.js
RUN echo '    { id: "overnight", name: "Overnight Shipping", description: "Next business day", price: 29.99, estimated_days: 1 }' >> /tmp/server.js
RUN echo '  ];' >> /tmp/server.js
RUN echo '  res.json(shippingOptions);' >> /tmp/server.js
RUN echo '});' >> /tmp/server.js
RUN echo '' >> /tmp/server.js
RUN echo '// Payment routes' >> /tmp/server.js
RUN echo 'app.get("/api/payment/methods", (req, res) => {' >> /tmp/server.js
RUN echo '  console.log("Fetching payment methods");' >> /tmp/server.js
RUN echo '  const paymentMethods = [' >> /tmp/server.js
RUN echo '    { id: "card", name: "Credit/Debit Card", description: "Pay with Visa, Mastercard, or American Express", icon: "credit-card" },' >> /tmp/server.js
RUN echo '    { id: "paypal", name: "PayPal", description: "Pay with your PayPal account", icon: "paypal" },' >> /tmp/server.js
RUN echo '    { id: "apple-pay", name: "Apple Pay", description: "Quick and secure payment with Apple Pay", icon: "apple" }' >> /tmp/server.js
RUN echo '  ];' >> /tmp/server.js
RUN echo '  res.json(paymentMethods);' >> /tmp/server.js
RUN echo '});' >> /tmp/server.js
RUN echo '' >> /tmp/server.js
RUN echo '// Start server' >> /tmp/server.js
RUN echo 'app.listen(port, () => {' >> /tmp/server.js
RUN echo '  console.log(`Server running on port ${port}`);' >> /tmp/server.js
RUN echo '});' >> /tmp/server.js
RUN echo '' >> /tmp/server.js
RUN echo 'module.exports = app;' >> /tmp/server.js

# Copy the temporary file to src/server.js if it doesn't exist
RUN if [ ! -f src/server.js ]; then \
    echo "Creating server.js file"; \
    cp /tmp/server.js src/server.js; \
fi

# Verify server.js exists
RUN ls -la src/
RUN cat src/server.js

# Expose port
EXPOSE 8080

# Command to start the application
CMD ["npm", "start"] 