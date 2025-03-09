FROM node:20.11.1-alpine3.19

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all files from the backend directory
COPY . .

# Explicitly create the src directory and a minimal server file
RUN mkdir -p /app/src
RUN echo 'const express = require("express");' > /app/src/server.js
RUN echo 'const cors = require("cors");' >> /app/src/server.js
RUN echo 'const nodemailer = require("nodemailer");' >> /app/src/server.js
RUN echo 'const app = express();' >> /app/src/server.js
RUN echo 'const port = process.env.PORT || 8080;' >> /app/src/server.js
RUN echo '' >> /app/src/server.js
RUN echo '// Middleware' >> /app/src/server.js
RUN echo 'app.use(cors());' >> /app/src/server.js
RUN echo 'app.use(express.json());' >> /app/src/server.js
RUN echo '' >> /app/src/server.js
RUN echo '// Health check route' >> /app/src/server.js
RUN echo 'app.get("/api/health", (req, res) => {' >> /app/src/server.js
RUN echo '  res.json({ status: "ok" });' >> /app/src/server.js
RUN echo '});' >> /app/src/server.js
RUN echo '' >> /app/src/server.js
RUN echo '// Shipping routes' >> /app/src/server.js
RUN echo 'app.get("/api/shipping/options", (req, res) => {' >> /app/src/server.js
RUN echo '  console.log("Fetching shipping options");' >> /app/src/server.js
RUN echo '  const shippingOptions = [' >> /app/src/server.js
RUN echo '    { id: "standard", name: "Standard Shipping", description: "3-5 business days", price: 5.99, estimated_days: 5 },' >> /app/src/server.js
RUN echo '    { id: "express", name: "Express Shipping", description: "1-2 business days", price: 14.99, estimated_days: 2 },' >> /app/src/server.js
RUN echo '    { id: "overnight", name: "Overnight Shipping", description: "Next business day", price: 29.99, estimated_days: 1 }' >> /app/src/server.js
RUN echo '  ];' >> /app/src/server.js
RUN echo '  res.json(shippingOptions);' >> /app/src/server.js
RUN echo '});' >> /app/src/server.js
RUN echo '' >> /app/src/server.js
RUN echo '// Payment routes' >> /app/src/server.js
RUN echo 'app.get("/api/payment/methods", (req, res) => {' >> /app/src/server.js
RUN echo '  console.log("Fetching payment methods");' >> /app/src/server.js
RUN echo '  const paymentMethods = [' >> /app/src/server.js
RUN echo '    { id: "card", name: "Credit/Debit Card", description: "Pay with Visa, Mastercard, or American Express", icon: "credit-card" },' >> /app/src/server.js
RUN echo '    { id: "paypal", name: "PayPal", description: "Pay with your PayPal account", icon: "paypal" },' >> /app/src/server.js
RUN echo '    { id: "apple-pay", name: "Apple Pay", description: "Quick and secure payment with Apple Pay", icon: "apple" }' >> /app/src/server.js
RUN echo '  ];' >> /app/src/server.js
RUN echo '  res.json(paymentMethods);' >> /app/src/server.js
RUN echo '});' >> /app/src/server.js
RUN echo '' >> /app/src/server.js
RUN echo '// Start server' >> /app/src/server.js
RUN echo 'app.listen(port, () => {' >> /app/src/server.js
RUN echo '  console.log(`Server running on port ${port}`);' >> /app/src/server.js
RUN echo '});' >> /app/src/server.js
RUN echo '' >> /app/src/server.js
RUN echo 'module.exports = app;' >> /app/src/server.js

# Debug: List files to confirm server.js exists
RUN ls -la /app/src/

# Ensure the file is executable
RUN chmod +x /app/src/server.js

# Expose port
EXPOSE 8080

# Command to start the application
CMD ["npm", "start"] 