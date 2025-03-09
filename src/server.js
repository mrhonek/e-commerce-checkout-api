const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// Initialize app
const app = express();
const port = process.env.PORT || 8080;
const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/e-commerce";

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));

// Helper functions for image processing
function getPlaceholderImage(index = 0) {
  const imageIds = [11, 26, 20, 64, 65, 67, 103, 104, 106, 119];
  const id = imageIds[index % imageIds.length];
  return `https://picsum.photos/id/${id}/400/400`;
}

function processProductImages(product, index = 0) {
  const p = product.toObject ? product.toObject() : { ...product };
  if (!p.image || !p.image.startsWith("http")) {
    p.image = getPlaceholderImage(index);
  }
  if (!p.images || !Array.isArray(p.images) || p.images.length === 0) {
    p.images = [
      p.image,
      getPlaceholderImage(index + 1),
      getPlaceholderImage(index + 2)
    ];
  } else {
    p.images = p.images.map((img, i) => {
      return img && img.startsWith("http") ? img : getPlaceholderImage(index + i);
    });
  }
  p.inStock = true;
  p.stock = p.stock || 10;
  return p;
}

function normalizeId(id) {
  if (!id) return "";
  return String(id).trim();
}

// Middleware
app.use(cors());
app.use(express.json());

// Debug middleware
app.use((req, res, next) => {
  console.log("Incoming request:", {
    method: req.method,
    path: req.path,
    body: req.body,
    params: req.params,
    cartSize: cartItems.length
  });
  next();
});

// Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Product routes
app.get("/api/products", async (req, res) => {
  try {
    let Product;
    try {
      Product = mongoose.model("Product");
    } catch (e) {
      const ProductSchema = new mongoose.Schema({
        name: String,
        description: String,
        price: Number,
        image: String,
        images: [String],
        category: String,
        isFeatured: Boolean,
        featured: Boolean,
        is_featured: Boolean,
        rating: Number,
        reviews: Number,
        stock: Number,
        inStock: Boolean
      }, { timestamps: true });
      Product = mongoose.model("Product", ProductSchema);
    }
    let products = await Product.find();
    products = products.map((product, index) => processProductImages(product, index));
    console.log("Found products:", products.length);
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

app.get("/api/products/:id", async (req, res) => {
  try {
    const productId = req.params.id;
    console.log("Getting product with ID:", productId);
    let Product;
    try {
      Product = mongoose.model("Product");
    } catch (e) {
      return res.status(404).json({ error: "Product not found" });
    }
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    const processedProduct = processProductImages(product);
    res.json(processedProduct);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// Cart routes
let cartItems = [];

app.get("/api/cart", (req, res) => {
  console.log("Cart requested, current items:", JSON.stringify(cartItems, null, 2));
  const cart = {
    items: cartItems.map(item => ({
      ...item,
      id: item.itemId
    })),
    subtotal: calculateSubtotal(cartItems),
    tax: calculateTax(cartItems),
    total: calculateTotal(cartItems)
  };
  res.json(cart);
});

app.post("/api/cart/items", (req, res) => {
  const { productId, name, price, quantity, image } = req.body;
  console.log("Received add to cart request:", JSON.stringify({ productId, name, price, quantity, image }, null, 2));

  const normalizedProductId = normalizeId(productId);
  const itemId = `item-${Date.now()}`;
  console.log("Processed IDs:", { originalProductId: productId, normalizedProductId, generatedItemId: itemId });

  if (!normalizedProductId || !name || !price || !quantity) {
    console.log("Missing required fields:", { productId, name, price, quantity });
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const existingItemIndex = cartItems.findIndex(item => normalizeId(item.productId) === normalizedProductId);
    console.log("Existing item check:", { existingItemIndex, existingItem: existingItemIndex >= 0 ? cartItems[existingItemIndex] : null });

    let updatedItem;
    if (existingItemIndex >= 0) {
      cartItems[existingItemIndex].quantity += quantity;
      updatedItem = cartItems[existingItemIndex];
      console.log("Updated existing item quantity:", updatedItem);
    } else {
      const newItem = {
        id: itemId,
        productId: normalizedProductId,
        itemId: itemId,
        name,
        price,
        quantity,
        image: image && image.startsWith("http") ? image : getPlaceholderImage(cartItems.length)
      };
      cartItems.push(newItem);
      updatedItem = newItem;
      console.log("Added new item to cart:", newItem);
    }

    console.log("Current cart state:", JSON.stringify(cartItems, null, 2));

    const updatedCart = {
      items: cartItems.map(item => ({
        ...item,
        id: item.itemId
      })),
      subtotal: calculateSubtotal(cartItems),
      tax: calculateTax(cartItems),
      total: calculateTotal(cartItems),
      updatedItem: { ...updatedItem, id: updatedItem.itemId }
    };
    console.log("Returning updated cart:", JSON.stringify(updatedCart, null, 2));
    res.status(201).json(updatedCart);
  } catch (error) {
    console.error("Error adding item to cart:", error);
    res.status(500).json({ error: "Failed to add item to cart" });
  }
});

app.put("/api/cart/items/:itemId", (req, res) => {
  const rawItemId = req.params.itemId;
  const { quantity } = req.body;
  console.log("Update cart request received:", { itemId: rawItemId, quantity, currentCartItems: cartItems.length, cartItemIds: cartItems.map(item => item.itemId) });

  if (!rawItemId) {
    console.log("Missing item ID");
    return res.status(400).json({ error: "Item ID is required" });
  }

  if (quantity === undefined || quantity === null) {
    console.log("Update rejected: Missing quantity");
    return res.status(400).json({ error: "Quantity is required" });
  }

  try {
    const itemIndex = cartItems.findIndex(item => item.itemId === rawItemId);
    console.log("Item lookup result:", { requestedItemId: rawItemId, foundIndex: itemIndex, matchedItem: itemIndex >= 0 ? cartItems[itemIndex] : null, allItemIds: cartItems.map(item => item.itemId) });

    if (itemIndex === -1) {
      console.log("Item not found in cart. Available items:", JSON.stringify(cartItems.map(item => ({ itemId: item.itemId, productId: item.productId, name: item.name })), null, 2));
      return res.status(404).json({ error: "Item not found in cart" });
    }

    const oldQuantity = cartItems[itemIndex].quantity;
    cartItems[itemIndex].quantity = Number(quantity);
    console.log("Updated item quantity:", { itemId: rawItemId, oldQuantity, newQuantity: cartItems[itemIndex].quantity, updatedItem: cartItems[itemIndex] });

    const updatedCart = {
      items: cartItems,
      subtotal: calculateSubtotal(cartItems),
      tax: calculateTax(cartItems),
      total: calculateTotal(cartItems),
      updatedItem: cartItems[itemIndex]
    };
    console.log("Returning updated cart:", JSON.stringify(updatedCart, null, 2));
    return res.json(updatedCart);
  } catch (error) {
    console.error("Error updating cart:", error);
    return res.status(500).json({ error: "Failed to update cart" });
  }
});

app.delete("/api/cart/items/:itemId", (req, res) => {
  const rawItemId = req.params.itemId;
  console.log("Removing item from cart:", { rawItemId });
  console.log("Current cart items:", cartItems.map(item => ({
    productId: item.productId,
    itemId: item.itemId
  })));

  try {
    const countBefore = cartItems.length;
    cartItems = cartItems.filter(item => item.itemId !== rawItemId);
    const countAfter = cartItems.length;
    console.log(`Removed ${countBefore - countAfter} items from cart`);

    return res.json({
      items: cartItems,
      subtotal: calculateSubtotal(cartItems),
      tax: calculateTax(cartItems),
      total: calculateTotal(cartItems)
    });
  } catch (error) {
    console.error("Error removing item from cart:", error);
    return res.status(500).json({ error: "Failed to remove item from cart" });
  }
});

app.delete("/api/cart", (req, res) => {
  console.log("Clearing cart");
  cartItems = [];
  res.json({
    items: [],
    subtotal: 0,
    tax: 0,
    total: 0
  });
});

// Shipping routes
app.get("/api/shipping/options", (req, res) => {
  console.log("Fetching shipping options");
  const shippingOptions = [
    {
      id: "standard",
      name: "Standard Shipping",
      description: "3-5 business days",
      price: 5.99,
      estimated_days: 5
    },
    {
      id: "express",
      name: "Express Shipping",
      description: "1-2 business days",
      price: 14.99,
      estimated_days: 2
    },
    {
      id: "overnight",
      name: "Overnight Shipping",
      description: "Next business day",
      price: 29.99,
      estimated_days: 1
    }
  ];
  res.json(shippingOptions);
});

// Payment routes
app.get("/api/payment/methods", (req, res) => {
  console.log("Fetching payment methods");
  const paymentMethods = [
    {
      id: "card",
      name: "Credit/Debit Card",
      description: "Pay with Visa, Mastercard, or American Express",
      icon: "credit-card"
    },
    {
      id: "paypal",
      name: "PayPal",
      description: "Pay with your PayPal account",
      icon: "paypal"
    },
    {
      id: "apple-pay",
      name: "Apple Pay",
      description: "Quick and secure payment with Apple Pay",
      icon: "apple"
    }
  ];
  res.json(paymentMethods);
});

// Helper functions
function calculateSubtotal(items) {
  return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

function calculateTax(items) {
  const subtotal = calculateSubtotal(items);
  return subtotal * 0.08; // 8% tax rate
}

function calculateTotal(items) {
  const subtotal = calculateSubtotal(items);
  const tax = calculateTax(items);
  return subtotal + tax;
}

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app; 