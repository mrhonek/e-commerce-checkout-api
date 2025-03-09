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
RUN echo '// Helper functions for image processing' >> /tmp/server.js
RUN echo 'function getPlaceholderImage(index = 0) {' >> /tmp/server.js
RUN echo '  const imageIds = [11, 26, 20, 64, 65, 67, 103, 104, 106, 119];' >> /tmp/server.js
RUN echo '  const id = imageIds[index % imageIds.length];' >> /tmp/server.js
RUN echo '  return `https://picsum.photos/id/${id}/400/400`;' >> /tmp/server.js
RUN echo '}' >> /tmp/server.js
RUN echo '' >> /tmp/server.js
RUN echo 'function processProductImages(product, index = 0) {' >> /tmp/server.js
RUN echo '  const p = product.toObject ? product.toObject() : { ...product };' >> /tmp/server.js
RUN echo '  if (!p.image || !p.image.startsWith("http")) {' >> /tmp/server.js
RUN echo '    p.image = getPlaceholderImage(index);' >> /tmp/server.js
RUN echo '  }' >> /tmp/server.js
RUN echo '  if (!p.images || !Array.isArray(p.images) || p.images.length === 0) {' >> /tmp/server.js
RUN echo '    p.images = [' >> /tmp/server.js
RUN echo '      p.image,' >> /tmp/server.js
RUN echo '      getPlaceholderImage(index + 1),' >> /tmp/server.js
RUN echo '      getPlaceholderImage(index + 2)' >> /tmp/server.js
RUN echo '    ];' >> /tmp/server.js
RUN echo '  } else {' >> /tmp/server.js
RUN echo '    p.images = p.images.map((img, i) => {' >> /tmp/server.js
RUN echo '      return img && img.startsWith("http") ? img : getPlaceholderImage(index + i);' >> /tmp/server.js
RUN echo '    });' >> /tmp/server.js
RUN echo '  }' >> /tmp/server.js
RUN echo '  p.inStock = true;' >> /tmp/server.js
RUN echo '  p.stock = p.stock || 10;' >> /tmp/server.js
RUN echo '  return p;' >> /tmp/server.js
RUN echo '}' >> /tmp/server.js
RUN echo '' >> /tmp/server.js
RUN echo 'function normalizeId(id) {' >> /tmp/server.js
RUN echo '  if (!id) return "";' >> /tmp/server.js
RUN echo '  return String(id).trim();' >> /tmp/server.js
RUN echo '}' >> /tmp/server.js
RUN echo '' >> /tmp/server.js
RUN echo '// Helper functions for cart' >> /tmp/server.js
RUN echo 'function calculateSubtotal(items) {' >> /tmp/server.js
RUN echo '  return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);' >> /tmp/server.js
RUN echo '}' >> /tmp/server.js
RUN echo '' >> /tmp/server.js
RUN echo 'function calculateTax(items) {' >> /tmp/server.js
RUN echo '  const subtotal = calculateSubtotal(items);' >> /tmp/server.js
RUN echo '  return subtotal * 0.08; // 8% tax rate' >> /tmp/server.js
RUN echo '}' >> /tmp/server.js
RUN echo '' >> /tmp/server.js
RUN echo 'function calculateTotal(items) {' >> /tmp/server.js
RUN echo '  const subtotal = calculateSubtotal(items);' >> /tmp/server.js
RUN echo '  const tax = calculateTax(items);' >> /tmp/server.js
RUN echo '  return subtotal + tax;' >> /tmp/server.js
RUN echo '}' >> /tmp/server.js
RUN echo '' >> /tmp/server.js
RUN echo '// Mock product data' >> /tmp/server.js
RUN echo 'const mockProducts = [' >> /tmp/server.js
RUN echo '  { _id: "1", id: "1", name: "Premium Headphones", price: 249.99, description: "High-quality wireless headphones with noise cancellation", image: "https://picsum.photos/id/11/400/400", category: "Electronics", isFeatured: true, rating: 4.5, reviews: 120, stock: 15, inStock: true },' >> /tmp/server.js
RUN echo '  { _id: "2", id: "2", name: "Smart Watch", price: 199.99, description: "Feature-rich smartwatch with health tracking", image: "https://picsum.photos/id/26/400/400", category: "Electronics", isFeatured: true, rating: 4.3, reviews: 85, stock: 20, inStock: true },' >> /tmp/server.js
RUN echo '  { _id: "3", id: "3", name: "Wireless Earbuds", price: 99.99, description: "Comfortable earbuds with great sound quality", image: "https://picsum.photos/id/20/400/400", category: "Electronics", isFeatured: true, rating: 4.0, reviews: 56, stock: 25, inStock: true },' >> /tmp/server.js
RUN echo '  { _id: "4", id: "4", name: "Desktop Monitor", price: 349.99, description: "Ultra-wide curved monitor for immersive viewing", image: "https://picsum.photos/id/64/400/400", category: "Electronics", isFeatured: false, rating: 4.7, reviews: 42, stock: 10, inStock: true },' >> /tmp/server.js
RUN echo '  { _id: "5", id: "5", name: "Mechanical Keyboard", price: 129.99, description: "Responsive mechanical keyboard for gaming", image: "https://picsum.photos/id/65/400/400", category: "Electronics", isFeatured: false, rating: 4.4, reviews: 35, stock: 18, inStock: true }' >> /tmp/server.js
RUN echo '];' >> /tmp/server.js
RUN echo '' >> /tmp/server.js
RUN echo '// Cart storage' >> /tmp/server.js
RUN echo 'let cartItems = [];' >> /tmp/server.js
RUN echo '' >> /tmp/server.js
RUN echo '// Middleware' >> /tmp/server.js
RUN echo 'app.use(cors());' >> /tmp/server.js
RUN echo 'app.use(express.json());' >> /tmp/server.js
RUN echo '' >> /tmp/server.js
RUN echo '// Debug middleware' >> /tmp/server.js
RUN echo 'app.use((req, res, next) => {' >> /tmp/server.js
RUN echo '  console.log("Incoming request:", {' >> /tmp/server.js
RUN echo '    method: req.method,' >> /tmp/server.js
RUN echo '    path: req.path,' >> /tmp/server.js
RUN echo '    body: req.body,' >> /tmp/server.js
RUN echo '    params: req.params,' >> /tmp/server.js
RUN echo '    cartSize: cartItems.length' >> /tmp/server.js
RUN echo '  });' >> /tmp/server.js
RUN echo '  next();' >> /tmp/server.js
RUN echo '});' >> /tmp/server.js
RUN echo '' >> /tmp/server.js
RUN echo '// Routes' >> /tmp/server.js
RUN echo 'app.get("/api/health", (req, res) => {' >> /tmp/server.js
RUN echo '  res.json({ status: "ok" });' >> /tmp/server.js
RUN echo '});' >> /tmp/server.js
RUN echo '' >> /tmp/server.js
RUN echo '// Product routes' >> /tmp/server.js
RUN echo 'app.get("/api/products", (req, res) => {' >> /tmp/server.js
RUN echo '  console.log("Fetching all products");' >> /tmp/server.js
RUN echo '  const processedProducts = mockProducts.map((product, index) => processProductImages(product, index));' >> /tmp/server.js
RUN echo '  res.json(processedProducts);' >> /tmp/server.js
RUN echo '});' >> /tmp/server.js
RUN echo '' >> /tmp/server.js
RUN echo 'app.get("/api/products/:id", (req, res) => {' >> /tmp/server.js
RUN echo '  const productId = req.params.id;' >> /tmp/server.js
RUN echo '  console.log("Fetching product with ID:", productId);' >> /tmp/server.js
RUN echo '  const product = mockProducts.find(p => p._id === productId || p.id === productId);' >> /tmp/server.js
RUN echo '  if (!product) {' >> /tmp/server.js
RUN echo '    return res.status(404).json({ error: "Product not found" });' >> /tmp/server.js
RUN echo '  }' >> /tmp/server.js
RUN echo '  const processedProduct = processProductImages(product);' >> /tmp/server.js
RUN echo '  res.json(processedProduct);' >> /tmp/server.js
RUN echo '});' >> /tmp/server.js
RUN echo '' >> /tmp/server.js
RUN echo '// Cart routes' >> /tmp/server.js
RUN echo 'app.get("/api/cart", (req, res) => {' >> /tmp/server.js
RUN echo '  console.log("Cart requested, current items:", JSON.stringify(cartItems, null, 2));' >> /tmp/server.js
RUN echo '  const cart = {' >> /tmp/server.js
RUN echo '    items: cartItems.map(item => ({' >> /tmp/server.js
RUN echo '      ...item,' >> /tmp/server.js
RUN echo '      id: item.itemId' >> /tmp/server.js
RUN echo '    })),' >> /tmp/server.js
RUN echo '    subtotal: calculateSubtotal(cartItems),' >> /tmp/server.js
RUN echo '    tax: calculateTax(cartItems),' >> /tmp/server.js
RUN echo '    total: calculateTotal(cartItems)' >> /tmp/server.js
RUN echo '  };' >> /tmp/server.js
RUN echo '  res.json(cart);' >> /tmp/server.js
RUN echo '});' >> /tmp/server.js
RUN echo '' >> /tmp/server.js
RUN echo 'app.post("/api/cart/items", (req, res) => {' >> /tmp/server.js
RUN echo '  const { productId, name, price, quantity, image } = req.body;' >> /tmp/server.js
RUN echo '  console.log("Received add to cart request:", JSON.stringify({ productId, name, price, quantity, image }, null, 2));' >> /tmp/server.js
RUN echo '' >> /tmp/server.js
RUN echo '  const normalizedProductId = normalizeId(productId);' >> /tmp/server.js
RUN echo '  const itemId = `item-${Date.now()}`;' >> /tmp/server.js
RUN echo '  console.log("Processed IDs:", { originalProductId: productId, normalizedProductId, generatedItemId: itemId });' >> /tmp/server.js
RUN echo '' >> /tmp/server.js
RUN echo '  if (!normalizedProductId || !name || !price || !quantity) {' >> /tmp/server.js
RUN echo '    console.log("Missing required fields:", { productId, name, price, quantity });' >> /tmp/server.js
RUN echo '    return res.status(400).json({ message: "Missing required fields" });' >> /tmp/server.js
RUN echo '  }' >> /tmp/server.js
RUN echo '' >> /tmp/server.js
RUN echo '  try {' >> /tmp/server.js
RUN echo '    const existingItemIndex = cartItems.findIndex(item => normalizeId(item.productId) === normalizedProductId);' >> /tmp/server.js
RUN echo '    console.log("Existing item check:", { existingItemIndex, existingItem: existingItemIndex >= 0 ? cartItems[existingItemIndex] : null });' >> /tmp/server.js
RUN echo '' >> /tmp/server.js
RUN echo '    let updatedItem;' >> /tmp/server.js
RUN echo '    if (existingItemIndex >= 0) {' >> /tmp/server.js
RUN echo '      cartItems[existingItemIndex].quantity += quantity;' >> /tmp/server.js
RUN echo '      updatedItem = cartItems[existingItemIndex];' >> /tmp/server.js
RUN echo '      console.log("Updated existing item quantity:", updatedItem);' >> /tmp/server.js
RUN echo '    } else {' >> /tmp/server.js
RUN echo '      const newItem = {' >> /tmp/server.js
RUN echo '        id: itemId,' >> /tmp/server.js
RUN echo '        productId: normalizedProductId,' >> /tmp/server.js
RUN echo '        itemId: itemId,' >> /tmp/server.js
RUN echo '        name,' >> /tmp/server.js
RUN echo '        price,' >> /tmp/server.js
RUN echo '        quantity,' >> /tmp/server.js
RUN echo '        image: image && image.startsWith("http") ? image : getPlaceholderImage(cartItems.length)' >> /tmp/server.js
RUN echo '      };' >> /tmp/server.js
RUN echo '      cartItems.push(newItem);' >> /tmp/server.js
RUN echo '      updatedItem = newItem;' >> /tmp/server.js
RUN echo '      console.log("Added new item to cart:", newItem);' >> /tmp/server.js
RUN echo '    }' >> /tmp/server.js
RUN echo '' >> /tmp/server.js
RUN echo '    console.log("Current cart state:", JSON.stringify(cartItems, null, 2));' >> /tmp/server.js
RUN echo '' >> /tmp/server.js
RUN echo '    const updatedCart = {' >> /tmp/server.js
RUN echo '      items: cartItems.map(item => ({' >> /tmp/server.js
RUN echo '        ...item,' >> /tmp/server.js
RUN echo '        id: item.itemId' >> /tmp/server.js
RUN echo '      })),' >> /tmp/server.js
RUN echo '      subtotal: calculateSubtotal(cartItems),' >> /tmp/server.js
RUN echo '      tax: calculateTax(cartItems),' >> /tmp/server.js
RUN echo '      total: calculateTotal(cartItems),' >> /tmp/server.js
RUN echo '      updatedItem: { ...updatedItem, id: updatedItem.itemId }' >> /tmp/server.js
RUN echo '    };' >> /tmp/server.js
RUN echo '    console.log("Returning updated cart:", JSON.stringify(updatedCart, null, 2));' >> /tmp/server.js
RUN echo '    res.status(201).json(updatedCart);' >> /tmp/server.js
RUN echo '  } catch (error) {' >> /tmp/server.js
RUN echo '    console.error("Error adding item to cart:", error);' >> /tmp/server.js
RUN echo '    res.status(500).json({ error: "Failed to add item to cart" });' >> /tmp/server.js
RUN echo '  }' >> /tmp/server.js
RUN echo '});' >> /tmp/server.js
RUN echo '' >> /tmp/server.js
RUN echo 'app.put("/api/cart/items/:itemId", (req, res) => {' >> /tmp/server.js
RUN echo '  const rawItemId = req.params.itemId;' >> /tmp/server.js
RUN echo '  const { quantity } = req.body;' >> /tmp/server.js
RUN echo '  console.log("Update cart request received:", { itemId: rawItemId, quantity, currentCartItems: cartItems.length, cartItemIds: cartItems.map(item => item.itemId) });' >> /tmp/server.js
RUN echo '' >> /tmp/server.js
RUN echo '  if (!rawItemId) {' >> /tmp/server.js
RUN echo '    console.log("Missing item ID");' >> /tmp/server.js
RUN echo '    return res.status(400).json({ error: "Item ID is required" });' >> /tmp/server.js
RUN echo '  }' >> /tmp/server.js
RUN echo '' >> /tmp/server.js
RUN echo '  if (quantity === undefined || quantity === null) {' >> /tmp/server.js
RUN echo '    console.log("Update rejected: Missing quantity");' >> /tmp/server.js
RUN echo '    return res.status(400).json({ error: "Quantity is required" });' >> /tmp/server.js
RUN echo '  }' >> /tmp/server.js
RUN echo '' >> /tmp/server.js
RUN echo '  try {' >> /tmp/server.js
RUN echo '    const itemIndex = cartItems.findIndex(item => item.itemId === rawItemId);' >> /tmp/server.js
RUN echo '    console.log("Item lookup result:", { requestedItemId: rawItemId, foundIndex: itemIndex, matchedItem: itemIndex >= 0 ? cartItems[itemIndex] : null, allItemIds: cartItems.map(item => item.itemId) });' >> /tmp/server.js
RUN echo '' >> /tmp/server.js
RUN echo '    if (itemIndex === -1) {' >> /tmp/server.js
RUN echo '      console.log("Item not found in cart. Available items:", JSON.stringify(cartItems.map(item => ({ itemId: item.itemId, productId: item.productId, name: item.name })), null, 2));' >> /tmp/server.js
RUN echo '      return res.status(404).json({ error: "Item not found in cart" });' >> /tmp/server.js
RUN echo '    }' >> /tmp/server.js
RUN echo '' >> /tmp/server.js
RUN echo '    const oldQuantity = cartItems[itemIndex].quantity;' >> /tmp/server.js
RUN echo '    cartItems[itemIndex].quantity = Number(quantity);' >> /tmp/server.js
RUN echo '    console.log("Updated item quantity:", { itemId: rawItemId, oldQuantity, newQuantity: cartItems[itemIndex].quantity, updatedItem: cartItems[itemIndex] });' >> /tmp/server.js
RUN echo '' >> /tmp/server.js
RUN echo '    const updatedCart = {' >> /tmp/server.js
RUN echo '      items: cartItems,' >> /tmp/server.js
RUN echo '      subtotal: calculateSubtotal(cartItems),' >> /tmp/server.js
RUN echo '      tax: calculateTax(cartItems),' >> /tmp/server.js
RUN echo '      total: calculateTotal(cartItems),' >> /tmp/server.js
RUN echo '      updatedItem: cartItems[itemIndex]' >> /tmp/server.js
RUN echo '    };' >> /tmp/server.js
RUN echo '    console.log("Returning updated cart:", JSON.stringify(updatedCart, null, 2));' >> /tmp/server.js
RUN echo '    return res.json(updatedCart);' >> /tmp/server.js
RUN echo '  } catch (error) {' >> /tmp/server.js
RUN echo '    console.error("Error updating cart:", error);' >> /tmp/server.js
RUN echo '    return res.status(500).json({ error: "Failed to update cart" });' >> /tmp/server.js
RUN echo '  }' >> /tmp/server.js
RUN echo '});' >> /tmp/server.js
RUN echo '' >> /tmp/server.js
RUN echo 'app.delete("/api/cart/items/:itemId", (req, res) => {' >> /tmp/server.js
RUN echo '  const rawItemId = req.params.itemId;' >> /tmp/server.js
RUN echo '  console.log("Removing item from cart:", { rawItemId });' >> /tmp/server.js
RUN echo '  console.log("Current cart items:", cartItems.map(item => ({' >> /tmp/server.js
RUN echo '    productId: item.productId,' >> /tmp/server.js
RUN echo '    itemId: item.itemId' >> /tmp/server.js
RUN echo '  })));' >> /tmp/server.js
RUN echo '' >> /tmp/server.js
RUN echo '  try {' >> /tmp/server.js
RUN echo '    const countBefore = cartItems.length;' >> /tmp/server.js
RUN echo '    cartItems = cartItems.filter(item => item.itemId !== rawItemId);' >> /tmp/server.js
RUN echo '    const countAfter = cartItems.length;' >> /tmp/server.js
RUN echo '    console.log(`Removed ${countBefore - countAfter} items from cart`);' >> /tmp/server.js
RUN echo '' >> /tmp/server.js
RUN echo '    return res.json({' >> /tmp/server.js
RUN echo '      items: cartItems,' >> /tmp/server.js
RUN echo '      subtotal: calculateSubtotal(cartItems),' >> /tmp/server.js
RUN echo '      tax: calculateTax(cartItems),' >> /tmp/server.js
RUN echo '      total: calculateTotal(cartItems)' >> /tmp/server.js
RUN echo '    });' >> /tmp/server.js
RUN echo '  } catch (error) {' >> /tmp/server.js
RUN echo '    console.error("Error removing item from cart:", error);' >> /tmp/server.js
RUN echo '    return res.status(500).json({ error: "Failed to remove item from cart" });' >> /tmp/server.js
RUN echo '  }' >> /tmp/server.js
RUN echo '});' >> /tmp/server.js
RUN echo '' >> /tmp/server.js
RUN echo 'app.delete("/api/cart", (req, res) => {' >> /tmp/server.js
RUN echo '  console.log("Clearing cart");' >> /tmp/server.js
RUN echo '  cartItems = [];' >> /tmp/server.js
RUN echo '  res.json({' >> /tmp/server.js
RUN echo '    items: [],' >> /tmp/server.js
RUN echo '    subtotal: 0,' >> /tmp/server.js
RUN echo '    tax: 0,' >> /tmp/server.js
RUN echo '    total: 0' >> /tmp/server.js
RUN echo '  });' >> /tmp/server.js
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
RUN echo '// Order placement' >> /tmp/server.js
RUN echo 'let orders = [];' >> /tmp/server.js
RUN echo '' >> /tmp/server.js
RUN echo 'app.post("/api/orders", (req, res) => {' >> /tmp/server.js
RUN echo '  try {' >> /tmp/server.js
RUN echo '    console.log("Receiving order. Request body:", JSON.stringify(req.body, null, 2));' >> /tmp/server.js
RUN echo '    const { items, customer, shipping, payment, shippingAddress, billingAddress, shippingOption, paymentMethod, subtotal, tax, total } = req.body;' >> /tmp/server.js
RUN echo '' >> /tmp/server.js
RUN echo '    // More flexible validation' >> /tmp/server.js
RUN echo '    const cartItems = items || req.body.cart?.items || req.body.cartItems || [];' >> /tmp/server.js
RUN echo '    const customerInfo = customer || req.body.customerInfo || req.body.user || {};' >> /tmp/server.js
RUN echo '    const shippingInfo = shipping || shippingOption || req.body.selectedShipping || {};' >> /tmp/server.js
RUN echo '    const paymentInfo = payment || paymentMethod || req.body.selectedPayment || {};' >> /tmp/server.js
RUN echo '    const shippingAddr = shippingAddress || customerInfo.shippingAddress || req.body.shippingAddress || {};' >> /tmp/server.js
RUN echo '    const billingAddr = billingAddress || customerInfo.billingAddress || req.body.billingAddress || {};' >> /tmp/server.js
RUN echo '' >> /tmp/server.js
RUN echo '    console.log("Processed order data:", {' >> /tmp/server.js
RUN echo '      cartItems: Array.isArray(cartItems) ? cartItems.length : "not an array",' >> /tmp/server.js
RUN echo '      customerInfo: JSON.stringify(customerInfo),' >> /tmp/server.js
RUN echo '      shippingInfo: JSON.stringify(shippingInfo),' >> /tmp/server.js
RUN echo '      paymentInfo: JSON.stringify(paymentInfo)' >> /tmp/server.js
RUN echo '    });' >> /tmp/server.js
RUN echo '' >> /tmp/server.js
RUN echo '    // Create order even with minimal data' >> /tmp/server.js
RUN echo '    const orderId = `order-${Date.now()}`;' >> /tmp/server.js
RUN echo '    const newOrder = {' >> /tmp/server.js
RUN echo '      id: orderId,' >> /tmp/server.js
RUN echo '      orderId: orderId,' >> /tmp/server.js
RUN echo '      items: cartItems,' >> /tmp/server.js
RUN echo '      customer: customerInfo,' >> /tmp/server.js
RUN echo '      shipping: shippingInfo,' >> /tmp/server.js
RUN echo '      payment: paymentInfo,' >> /tmp/server.js
RUN echo '      shippingAddress: shippingAddr,' >> /tmp/server.js
RUN echo '      billingAddress: billingAddr,' >> /tmp/server.js
RUN echo '      subtotal: subtotal || calculateSubtotal(cartItems) || 0,' >> /tmp/server.js
RUN echo '      tax: tax || (Array.isArray(cartItems) ? calculateTax(cartItems) : 0) || 0,' >> /tmp/server.js
RUN echo '      total: total || (Array.isArray(cartItems) ? calculateTotal(cartItems) : 0) || 0,' >> /tmp/server.js
RUN echo '      status: "confirmed",' >> /tmp/server.js
RUN echo '      createdAt: new Date().toISOString()' >> /tmp/server.js
RUN echo '    };' >> /tmp/server.js
RUN echo '' >> /tmp/server.js
RUN echo '    // Save order' >> /tmp/server.js
RUN echo '    orders.push(newOrder);' >> /tmp/server.js
RUN echo '    console.log(`Order ${orderId} created successfully`);' >> /tmp/server.js
RUN echo '' >> /tmp/server.js
RUN echo '    // Clear cart after successful order' >> /tmp/server.js
RUN echo '    cartItems = [];' >> /tmp/server.js
RUN echo '' >> /tmp/server.js
RUN echo '    // Return order confirmation' >> /tmp/server.js
RUN echo '    res.status(201).json({' >> /tmp/server.js
RUN echo '      success: true,' >> /tmp/server.js
RUN echo '      message: "Order placed successfully",' >> /tmp/server.js
RUN echo '      order: newOrder' >> /tmp/server.js
RUN echo '    });' >> /tmp/server.js
RUN echo '  } catch (error) {' >> /tmp/server.js
RUN echo '    console.error("Error creating order:", error);' >> /tmp/server.js
RUN echo '    res.status(500).json({ error: "Failed to place order" });' >> /tmp/server.js
RUN echo '  }' >> /tmp/server.js
RUN echo '});' >> /tmp/server.js
RUN echo '' >> /tmp/server.js
RUN echo '// Get orders history' >> /tmp/server.js
RUN echo 'app.get("/api/orders", (req, res) => {' >> /tmp/server.js
RUN echo '  console.log("Fetching orders history");' >> /tmp/server.js
RUN echo '  res.json(orders);' >> /tmp/server.js
RUN echo '});' >> /tmp/server.js
RUN echo '' >> /tmp/server.js
RUN echo '// Get specific order' >> /tmp/server.js
RUN echo 'app.get("/api/orders/:orderId", (req, res) => {' >> /tmp/server.js
RUN echo '  const orderId = req.params.orderId;' >> /tmp/server.js
RUN echo '  console.log(`Fetching order: ${orderId}`);' >> /tmp/server.js
RUN echo '  const order = orders.find(o => o.orderId === orderId || o.id === orderId);' >> /tmp/server.js
RUN echo '  if (!order) {' >> /tmp/server.js
RUN echo '    return res.status(404).json({ error: "Order not found" });' >> /tmp/server.js
RUN echo '  }' >> /tmp/server.js
RUN echo '  res.json(order);' >> /tmp/server.js
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
RUN cat src/server.js | head -20

# Expose port
EXPOSE 8080

# Command to start the application
CMD ["npm", "start"] 