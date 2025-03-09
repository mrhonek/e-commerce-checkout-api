const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  console.log('Body:', JSON.stringify(req.body));
  console.log('Params:', JSON.stringify(req.params));
  next();
});

// Helper functions
function getPlaceholderImage(index = 0) {
  const placeholders = [
    "https://via.placeholder.com/400x300/3498db/ffffff?text=Product+Image",
    "https://via.placeholder.com/400x300/e74c3c/ffffff?text=Product+Image",
    "https://via.placeholder.com/400x300/2ecc71/ffffff?text=Product+Image",
    "https://via.placeholder.com/400x300/f39c12/ffffff?text=Product+Image",
    "https://via.placeholder.com/400x300/9b59b6/ffffff?text=Product+Image"
  ];
  return placeholders[index % placeholders.length];
}

function processProductImages(product, index = 0) {
  if (!product.imageUrl) {
    product.imageUrl = getPlaceholderImage(index);
  }
  return product;
}

function normalizeId(id) {
  if (id && typeof id === "object" && id._id) {
    return id._id.toString();
  }
  return id ? id.toString() : null;
}

function calculateSubtotal(items) {
  return items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
}

function calculateTax(items) {
  const subtotal = calculateSubtotal(items);
  const taxRate = 0.085; // 8.5% tax rate
  return subtotal * taxRate;
}

function calculateTotal(items) {
  const subtotal = calculateSubtotal(items);
  const tax = calculateTax(items);
  return subtotal + tax;
}

// Mock products data
const products = [
  { _id: "prod1", name: "Ergonomic Office Chair", description: "Premium ergonomic office chair with lumbar support and adjustable height.", price: 249.99, stockQuantity: 15, isFeatured: true, imageUrl: "https://via.placeholder.com/400x300/3498db/ffffff?text=Office+Chair" },
  { _id: "prod2", name: "Wireless Noise-Cancelling Headphones", description: "Premium wireless headphones with active noise cancellation and 30-hour battery life.", price: 199.99, stockQuantity: 25, isFeatured: true, imageUrl: "https://via.placeholder.com/400x300/e74c3c/ffffff?text=Headphones" },
  { _id: "prod3", name: "Smart Watch Series 5", description: "Latest smart watch with health monitoring, GPS, and waterproof design.", price: 329.99, stockQuantity: 10, isFeatured: false, imageUrl: "https://via.placeholder.com/400x300/2ecc71/ffffff?text=Smart+Watch" },
  { _id: "prod4", name: "4K Ultra HD TV - 55 inch", description: "Crystal clear 4K Ultra HD smart TV with HDR and voice control.", price: 599.99, stockQuantity: 8, isFeatured: true, imageUrl: "https://via.placeholder.com/400x300/f39c12/ffffff?text=4K+TV" },
  { _id: "prod5", name: "Professional DSLR Camera", description: "High-resolution DSLR camera with 24.2MP sensor and 4K video recording.", price: 899.99, stockQuantity: 5, isFeatured: false, imageUrl: "https://via.placeholder.com/400x300/9b59b6/ffffff?text=DSLR+Camera" },
  { _id: "prod6", name: "Bluetooth Portable Speaker", description: "Waterproof Bluetooth speaker with 24-hour battery life and rich bass.", price: 79.99, stockQuantity: 30, isFeatured: false, imageUrl: "https://via.placeholder.com/400x300/34495e/ffffff?text=Bluetooth+Speaker" }
];

// In-memory cart storage
let cart = { items: [] };

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// API Root
app.get("/api", (req, res) => {
  res.json({
    message: "E-Commerce API is running",
    endpoints: ["/api/products", "/api/cart", "/api/shipping", "/api/payment-methods"]
  });
});

// Get all products
app.get("/api/products", (req, res) => {
  console.log("GET /api/products");
  const processedProducts = products.map((product, index) => processProductImages(product, index));
  res.json(processedProducts);
});

// Get featured products
app.get("/api/products/featured", (req, res) => {
  console.log("GET /api/products/featured");
  const featuredProducts = products.filter(p => p.isFeatured);
  const processedProducts = featuredProducts.map((product, index) => processProductImages(product, index));
  res.json(processedProducts);
});

// Get a specific product
app.get("/api/products/:id", (req, res) => {
  console.log(`GET /api/products/${req.params.id}`);
  const product = products.find(p => p._id === req.params.id);
  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }
  res.json(processProductImages(product));
});

// Get cart
app.get("/api/cart", (req, res) => {
  console.log("GET /api/cart - Current cart:", JSON.stringify(cart));
  const cartWithIds = {
    ...cart,
    items: cart.items.map(item => ({
      ...item,
      id: item.itemId // Ensure id is present for frontend compatibility
    }))
  };
  res.json(cartWithIds);
});

// Add item to cart
app.post("/api/cart/items", (req, res) => {
  console.log("POST /api/cart/items - Request body:", JSON.stringify(req.body));
  
  const { productId, quantity } = req.body;
  
  if (!productId) {
    console.log("Missing productId in request");
    return res.status(400).json({ error: "productId is required" });
  }
  
  if (!quantity || quantity < 1) {
    console.log("Invalid quantity in request");
    return res.status(400).json({ error: "quantity must be a positive number" });
  }
  
  const product = products.find(p => p._id === productId);
  if (!product) {
    console.log(`Product with ID ${productId} not found`);
    return res.status(404).json({ error: "Product not found" });
  }
  
  // Generate a unique itemId for this cart item
  const itemId = `item_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  
  // Create new cart item with both productId and itemId
  const newItem = {
    itemId,
    productId,
    name: product.name,
    price: product.price,
    quantity: Number(quantity)
  };
  
  cart.items.push(newItem);
  
  console.log(`Added item to cart. ItemId: ${itemId}, ProductId: ${productId}, Current cart size: ${cart.items.length}`);
  console.log("Updated cart:", JSON.stringify(cart));
  
  // Return the complete item including the generated itemId
  res.status(201).json(newItem);
});

// Update cart item
app.put("/api/cart/items/:itemId", (req, res) => {
  console.log(`PUT /api/cart/items/${req.params.itemId} - Request body:`, JSON.stringify(req.body));
  console.log("Current cart items:", JSON.stringify(cart.items));
  
  const { itemId } = req.params;
  const { quantity } = req.body;
  
  if (!quantity || quantity < 0) {
    console.log("Invalid quantity in request");
    return res.status(400).json({ error: "quantity must be a non-negative number" });
  }
  
  const itemIndex = cart.items.findIndex(item => item.itemId === itemId);
  
  console.log(`Looking for item with itemId ${itemId}. Found at index: ${itemIndex}`);
  
  if (itemIndex === -1) {
    console.log(`Item with ID ${itemId} not found in cart`);
    return res.status(404).json({ error: "Item not found in cart" });
  }
  
  if (quantity === 0) {
    // Remove item if quantity is 0
    cart.items.splice(itemIndex, 1);
    console.log(`Removed item with ID ${itemId} from cart`);
  } else {
    // Update quantity
    cart.items[itemIndex].quantity = Number(quantity);
    console.log(`Updated quantity of item with ID ${itemId} to ${quantity}`);
  }
  
  console.log("Updated cart:", JSON.stringify(cart));
  res.json(cart);
});

// Delete cart item
app.delete("/api/cart/items/:itemId", (req, res) => {
  console.log(`DELETE /api/cart/items/${req.params.itemId}`);
  
  const { itemId } = req.params;
  const itemIndex = cart.items.findIndex(item => item.itemId === itemId);
  
  if (itemIndex === -1) {
    console.log(`Item with ID ${itemId} not found in cart`);
    return res.status(404).json({ error: "Item not found in cart" });
  }
  
  cart.items.splice(itemIndex, 1);
  console.log(`Removed item with ID ${itemId} from cart`);
  console.log("Updated cart:", JSON.stringify(cart));
  
  res.json(cart);
});

// Clear cart
app.delete("/api/cart", (req, res) => {
  console.log("DELETE /api/cart - Clearing cart");
  cart = { items: [] };
  res.json(cart);
});

// Shipping options
app.get("/api/shipping", (req, res) => {
  const shippingOptions = [
    { id: "standard", name: "Standard Shipping", price: 5.99, estimatedDays: "3-5 business days" },
    { id: "express", name: "Express Shipping", price: 12.99, estimatedDays: "1-2 business days" },
    { id: "free", name: "Free Shipping", price: 0, estimatedDays: "5-7 business days" }
  ];
  res.json(shippingOptions);
});

// Payment methods
app.get("/api/payment-methods", (req, res) => {
  const paymentMethods = [
    { id: "credit_card", name: "Credit Card" },
    { id: "paypal", name: "PayPal" }
  ];
  res.json(paymentMethods);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/api/health`);
}); 