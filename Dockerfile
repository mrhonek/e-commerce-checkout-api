FROM node:20.11.1-alpine3.19

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all files from the backend directory
COPY . .

# Create src directory if it doesn't exist
RUN mkdir -p src

# Create server.js if it doesn't exist
RUN if [ ! -f src/server.js ]; then \
    echo "Creating backup server.js file"; \
    echo 'const express = require("express");\n\
const cors = require("cors");\n\
\n\
// Initialize app\n\
const app = express();\n\
const port = process.env.PORT || 8080;\n\
\n\
// Middleware\n\
app.use(cors());\n\
app.use(express.json());\n\
\n\
// Routes\n\
app.get("/api/health", (req, res) => {\n\
  res.json({ status: "ok" });\n\
});\n\
\n\
// Shipping routes\n\
app.get("/api/shipping/options", (req, res) => {\n\
  console.log("Fetching shipping options");\n\
  const shippingOptions = [\n\
    { id: "standard", name: "Standard Shipping", description: "3-5 business days", price: 5.99, estimated_days: 5 },\n\
    { id: "express", name: "Express Shipping", description: "1-2 business days", price: 14.99, estimated_days: 2 },\n\
    { id: "overnight", name: "Overnight Shipping", description: "Next business day", price: 29.99, estimated_days: 1 }\n\
  ];\n\
  res.json(shippingOptions);\n\
});\n\
\n\
// Payment routes\n\
app.get("/api/payment/methods", (req, res) => {\n\
  console.log("Fetching payment methods");\n\
  const paymentMethods = [\n\
    { id: "card", name: "Credit/Debit Card", description: "Pay with Visa, Mastercard, or American Express", icon: "credit-card" },\n\
    { id: "paypal", name: "PayPal", description: "Pay with your PayPal account", icon: "paypal" },\n\
    { id: "apple-pay", name: "Apple Pay", description: "Quick and secure payment with Apple Pay", icon: "apple" }\n\
  ];\n\
  res.json(paymentMethods);\n\
});\n\
\n\
// Start server\n\
app.listen(port, () => {\n\
  console.log(`Server running on port ${port}`);\n\
});\n\
\n\
module.exports = app;' > src/server.js; \
fi

# Verify server.js exists
RUN ls -la src/

# Expose port
EXPOSE 8080

# Command to start the application
CMD ["npm", "start"] 