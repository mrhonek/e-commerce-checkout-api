FROM node:20.11.1-alpine3.19

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the entire source code
COPY . .

# Debug: List contents (use || true to prevent failure)
RUN echo "Listing files in /app:" && ls -la || true

# Create src directory if it doesn't exist
RUN mkdir -p src

# Create a simple server file with CommonJS syntax
RUN echo "const express = require('express');" > src/server-ts.ts && \
    echo "const mongoose = require('mongoose');" >> src/server-ts.ts && \
    echo "const cors = require('cors');" >> src/server-ts.ts && \
    echo "" >> src/server-ts.ts && \
    echo "// Initialize app" >> src/server-ts.ts && \
    echo "const app = express();" >> src/server-ts.ts && \
    echo "const port = process.env.PORT || 8080;" >> src/server-ts.ts && \
    echo "const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/e-commerce';" >> src/server-ts.ts && \
    echo "" >> src/server-ts.ts && \
    echo "// Connect to MongoDB" >> src/server-ts.ts && \
    echo "mongoose.connect(MONGO_URI)" >> src/server-ts.ts && \
    echo "  .then(() => console.log('Connected to MongoDB'))" >> src/server-ts.ts && \
    echo "  .catch(err => console.error('MongoDB connection error:', err));" >> src/server-ts.ts && \
    echo "" >> src/server-ts.ts && \
    echo "// Helper functions for image processing" >> src/server-ts.ts && \
    echo "function getPlaceholderImage(index = 0) {" >> src/server-ts.ts && \
    echo "  // Use deterministic IDs based on index to ensure consistent images" >> src/server-ts.ts && \
    echo "  const imageIds = [11, 26, 20, 64, 65, 67, 103, 104, 106, 119];" >> src/server-ts.ts && \
    echo "  const id = imageIds[index % imageIds.length];" >> src/server-ts.ts && \
    echo "  return \`https://picsum.photos/id/\${id}/400/400\`;" >> src/server-ts.ts && \
    echo "}" >> src/server-ts.ts && \
    echo "" >> src/server-ts.ts && \
    echo "function processProductImages(product, index = 0) {" >> src/server-ts.ts && \
    echo "  // Convert to plain object if it's a Mongoose document" >> src/server-ts.ts && \
    echo "  const p = product.toObject ? product.toObject() : { ...product };" >> src/server-ts.ts && \
    echo "" >> src/server-ts.ts && \
    echo "  // Ensure the main image path is valid" >> src/server-ts.ts && \
    echo "  if (!p.image || !p.image.startsWith('http')) {" >> src/server-ts.ts && \
    echo "    p.image = getPlaceholderImage(index);" >> src/server-ts.ts && \
    echo "  }" >> src/server-ts.ts && \
    echo "" >> src/server-ts.ts && \
    echo "  // Create images array with valid URLs if needed" >> src/server-ts.ts && \
    echo "  if (!p.images || !Array.isArray(p.images) || p.images.length === 0) {" >> src/server-ts.ts && \
    echo "    // Create an array of 3 images based on the main image" >> src/server-ts.ts && \
    echo "    p.images = [" >> src/server-ts.ts && \
    echo "      p.image," >> src/server-ts.ts && \
    echo "      getPlaceholderImage(index + 1)," >> src/server-ts.ts && \
    echo "      getPlaceholderImage(index + 2)" >> src/server-ts.ts && \
    echo "    ];" >> src/server-ts.ts && \
    echo "  } else {" >> src/server-ts.ts && \
    echo "    // Fix any invalid URLs in the existing images array" >> src/server-ts.ts && \
    echo "    p.images = p.images.map((img, i) => {" >> src/server-ts.ts && \
    echo "      return img && img.startsWith('http') ? img : getPlaceholderImage(index + i);" >> src/server-ts.ts && \
    echo "    });" >> src/server-ts.ts && \
    echo "  }" >> src/server-ts.ts && \
    echo "" >> src/server-ts.ts && \
    echo "  // Ensure product has inStock flag set to true" >> src/server-ts.ts && \
    echo "  p.inStock = true;" >> src/server-ts.ts && \
    echo "  p.stock = p.stock || 10;" >> src/server-ts.ts && \
    echo "" >> src/server-ts.ts && \
    echo "  return p;" >> src/server-ts.ts && \
    echo "}" >> src/server-ts.ts && \
    echo "" >> src/server-ts.ts && \
    echo "// Normalize ID for comparison (handles ObjectId, strings, etc.)" >> src/server-ts.ts && \
    echo "function normalizeId(id) {" >> src/server-ts.ts && \
    echo "  if (!id) return '';" >> src/server-ts.ts && \
    echo "  return String(id).trim();" >> src/server-ts.ts && \
    echo "}" >> src/server-ts.ts && \
    echo "" >> src/server-ts.ts && \
    echo "// Middleware" >> src/server-ts.ts && \
    echo "app.use(cors());" >> src/server-ts.ts && \
    echo "app.use(express.json());" >> src/server-ts.ts && \
    echo "" >> src/server-ts.ts && \
    echo "// Debug middleware to log all requests" >> src/server-ts.ts && \
    echo "app.use((req, res, next) => {" >> src/server-ts.ts && \
    echo "  console.log('Incoming request:', {" >> src/server-ts.ts && \
    echo "    method: req.method," >> src/server-ts.ts && \
    echo "    path: req.path," >> src/server-ts.ts && \
    echo "    body: req.body," >> src/server-ts.ts && \
    echo "    params: req.params," >> src/server-ts.ts && \
    echo "    cartSize: cartItems.length" >> src/server-ts.ts && \
    echo "  });" >> src/server-ts.ts && \
    echo "  next();" >> src/server-ts.ts && \
    echo "});" >> src/server-ts.ts && \
    echo "" >> src/server-ts.ts && \
    echo "// Routes" >> src/server-ts.ts && \
    echo "app.get('/api/health', (req, res) => {" >> src/server-ts.ts && \
    echo "  res.json({ status: 'ok' });" >> src/server-ts.ts && \
    echo "});" >> src/server-ts.ts && \
    echo "" >> src/server-ts.ts && \
    echo "// Product routes" >> src/server-ts.ts && \
    echo "app.get('/api/products', async (req, res) => {" >> src/server-ts.ts && \
    echo "  try {" >> src/server-ts.ts && \
    echo "    let Product;" >> src/server-ts.ts && \
    echo "    try {" >> src/server-ts.ts && \
    echo "      Product = mongoose.model('Product');" >> src/server-ts.ts && \
    echo "    } catch (e) {" >> src/server-ts.ts && \
    echo "      const ProductSchema = new mongoose.Schema({" >> src/server-ts.ts && \
    echo "        name: String," >> src/server-ts.ts && \
    echo "        description: String," >> src/server-ts.ts && \
    echo "        price: Number," >> src/server-ts.ts && \
    echo "        image: String," >> src/server-ts.ts && \
    echo "        images: [String]," >> src/server-ts.ts && \
    echo "        category: String," >> src/server-ts.ts && \
    echo "        isFeatured: Boolean," >> src/server-ts.ts && \
    echo "        featured: Boolean," >> src/server-ts.ts && \
    echo "        is_featured: Boolean," >> src/server-ts.ts && \
    echo "        rating: Number," >> src/server-ts.ts && \
    echo "        reviews: Number," >> src/server-ts.ts && \
    echo "        stock: Number," >> src/server-ts.ts && \
    echo "        inStock: Boolean" >> src/server-ts.ts && \
    echo "      }, { timestamps: true });" >> src/server-ts.ts && \
    echo "      Product = mongoose.model('Product', ProductSchema);" >> src/server-ts.ts && \
    echo "    }" >> src/server-ts.ts && \
    echo "    let products = await Product.find();" >> src/server-ts.ts && \
    echo "" >> src/server-ts.ts && \
    echo "    // Process and enrich products" >> src/server-ts.ts && \
    echo "    products = products.map((product, index) => processProductImages(product, index));" >> src/server-ts.ts && \
    echo "" >> src/server-ts.ts && \
    echo "    console.log('Found products:', products.length);" >> src/server-ts.ts && \
    echo "    res.json(products);" >> src/server-ts.ts && \
    echo "  } catch (error) {" >> src/server-ts.ts && \
    echo "    console.error('Error fetching products:', error);" >> src/server-ts.ts && \
    echo "    res.status(500).json({ error: 'Failed to fetch products' });" >> src/server-ts.ts && \
    echo "  }" >> src/server-ts.ts && \
    echo "});" >> src/server-ts.ts && \
    echo "" >> src/server-ts.ts && \
    echo "// Get single product by ID" >> src/server-ts.ts && \
    echo "app.get('/api/products/:id', async (req, res) => {" >> src/server-ts.ts && \
    echo "  try {" >> src/server-ts.ts && \
    echo "    const productId = req.params.id;" >> src/server-ts.ts && \
    echo "    console.log('Getting product with ID:', productId);" >> src/server-ts.ts && \
    echo "" >> src/server-ts.ts && \
    echo "    let Product;" >> src/server-ts.ts && \
    echo "    try {" >> src/server-ts.ts && \
    echo "      Product = mongoose.model('Product');" >> src/server-ts.ts && \
    echo "    } catch (e) {" >> src/server-ts.ts && \
    echo "      return res.status(404).json({ error: 'Product not found' });" >> src/server-ts.ts && \
    echo "    }" >> src/server-ts.ts && \
    echo "" >> src/server-ts.ts && \
    echo "    const product = await Product.findById(productId);" >> src/server-ts.ts && \
    echo "" >> src/server-ts.ts && \
    echo "    if (!product) {" >> src/server-ts.ts && \
    echo "      return res.status(404).json({ error: 'Product not found' });" >> src/server-ts.ts && \
    echo "    }" >> src/server-ts.ts && \
    echo "" >> src/server-ts.ts && \
    echo "    // Process product data with image enhancement" >> src/server-ts.ts && \
    echo "    const processedProduct = processProductImages(product);" >> src/server-ts.ts && \
    echo "    res.json(processedProduct);" >> src/server-ts.ts && \
    echo "  } catch (error) {" >> src/server-ts.ts && \
    echo "    console.error('Error fetching product:', error);" >> src/server-ts.ts && \
    echo "    res.status(500).json({ error: 'Failed to fetch product' });" >> src/server-ts.ts && \
    echo "  }" >> src/server-ts.ts && \
    echo "});" >> src/server-ts.ts && \
    echo "" >> src/server-ts.ts && \
    echo "// Cart routes" >> src/server-ts.ts && \
    echo "// Mock cart data - in a real app, this would be stored in a database" >> src/server-ts.ts && \
    echo "let cartItems = [];" >> src/server-ts.ts && \
    echo "" >> src/server-ts.ts && \
    echo "// Get cart items" >> src/server-ts.ts && \
    echo "app.get('/api/cart', (req, res) => {" >> src/server-ts.ts && \
    echo "  console.log('Cart requested, current items:', JSON.stringify(cartItems, null, 2));" >> src/server-ts.ts && \
    echo "  const cart = {" >> src/server-ts.ts && \
    echo "    items: cartItems.map(item => ({" >> src/server-ts.ts && \
    echo "      ...item," >> src/server-ts.ts && \
    echo "      id: item.itemId // Ensure frontend has the correct ID" >> src/server-ts.ts && \
    echo "    }))," >> src/server-ts.ts && \
    echo "    subtotal: calculateSubtotal(cartItems)," >> src/server-ts.ts && \
    echo "    tax: calculateTax(cartItems)," >> src/server-ts.ts && \
    echo "    total: calculateTotal(cartItems)" >> src/server-ts.ts && \
    echo "  };" >> src/server-ts.ts && \
    echo "  res.json(cart);" >> src/server-ts.ts && \
    echo "});" >> src/server-ts.ts && \
    echo "" >> src/server-ts.ts && \
    echo "// Add item to cart" >> src/server-ts.ts && \
    echo "app.post('/api/cart/items', (req, res) => {" >> src/server-ts.ts && \
    echo "  const { productId, name, price, quantity, image } = req.body;" >> src/server-ts.ts && \
    echo "  console.log('Received add to cart request:', JSON.stringify({ productId, name, price, quantity, image }, null, 2));" >> src/server-ts.ts && \
    echo "" >> src/server-ts.ts && \
    echo "  const normalizedProductId = normalizeId(productId);" >> src/server-ts.ts && \
    echo "  const itemId = \`item-\${Date.now()}\`;" >> src/server-ts.ts && \
    echo "  console.log('Processed IDs:', { originalProductId: productId, normalizedProductId, generatedItemId: itemId });" >> src/server-ts.ts && \
    echo "" >> src/server-ts.ts && \
    echo "  if (!normalizedProductId || !name || !price || !quantity) {" >> src/server-ts.ts && \
    echo "    console.log('Missing required fields:', { productId, name, price, quantity });" >> src/server-ts.ts && \
    echo "    return res.status(400).json({ message: 'Missing required fields' });" >> src/server-ts.ts && \
    echo "  }" >> src/server-ts.ts && \
    echo "" >> src/server-ts.ts && \
    echo "  try {" >> src/server-ts.ts && \
    echo "    // Check if item already exists in cart" >> src/server-ts.ts && \
    echo "    const existingItemIndex = cartItems.findIndex(item => normalizeId(item.productId) === normalizedProductId);" >> src/server-ts.ts && \
    echo "    console.log('Existing item check:', { existingItemIndex, existingItem: existingItemIndex >= 0 ? cartItems[existingItemIndex] : null });" >> src/server-ts.ts && \
    echo "" >> src/server-ts.ts && \
    echo "    let updatedItem;" >> src/server-ts.ts && \
    echo "    if (existingItemIndex >= 0) {" >> src/server-ts.ts && \
    echo "      // Update quantity if item exists" >> src/server-ts.ts && \
    echo "      cartItems[existingItemIndex].quantity += quantity;" >> src/server-ts.ts && \
    echo "      updatedItem = cartItems[existingItemIndex];" >> src/server-ts.ts && \
    echo "      console.log('Updated existing item quantity:', updatedItem);" >> src/server-ts.ts && \
    echo "    } else {" >> src/server-ts.ts && \
    echo "      // Add new item if it doesn't exist" >> src/server-ts.ts && \
    echo "      const newItem = {" >> src/server-ts.ts && \
    echo "        id: itemId, // Add id field for frontend compatibility" >> src/server-ts.ts && \
    echo "        productId: normalizedProductId," >> src/server-ts.ts && \
    echo "        itemId: itemId," >> src/server-ts.ts && \
    echo "        name," >> src/server-ts.ts && \
    echo "        price," >> src/server-ts.ts && \
    echo "        quantity," >> src/server-ts.ts && \
    echo "        image: image && image.startsWith('http') ? image : getPlaceholderImage(cartItems.length)" >> src/server-ts.ts && \
    echo "      };" >> src/server-ts.ts && \
    echo "      cartItems.push(newItem);" >> src/server-ts.ts && \
    echo "      updatedItem = newItem;" >> src/server-ts.ts && \
    echo "      console.log('Added new item to cart:', newItem);" >> src/server-ts.ts && \
    echo "    }" >> src/server-ts.ts && \
    echo "" >> src/server-ts.ts && \
    echo "    console.log('Current cart state:', JSON.stringify(cartItems, null, 2));" >> src/server-ts.ts && \
    echo "" >> src/server-ts.ts && \
    echo "    // Return updated cart with the item that was added/updated" >> src/server-ts.ts && \
    echo "    const updatedCart = {" >> src/server-ts.ts && \
    echo "      items: cartItems.map(item => ({" >> src/server-ts.ts && \
    echo "        ...item," >> src/server-ts.ts && \
    echo "        id: item.itemId // Ensure frontend has the correct ID" >> src/server-ts.ts && \
    echo "      }))," >> src/server-ts.ts && \
    echo "      subtotal: calculateSubtotal(cartItems)," >> src/server-ts.ts && \
    echo "      tax: calculateTax(cartItems)," >> src/server-ts.ts && \
    echo "      total: calculateTotal(cartItems)," >> src/server-ts.ts && \
    echo "      updatedItem: { ...updatedItem, id: updatedItem.itemId }" >> src/server-ts.ts && \
    echo "    };" >> src/server-ts.ts && \
    echo "    console.log('Returning updated cart:', JSON.stringify(updatedCart, null, 2));" >> src/server-ts.ts && \
    echo "    res.status(201).json(updatedCart);" >> src/server-ts.ts && \
    echo "  } catch (error) {" >> src/server-ts.ts && \
    echo "    console.error('Error adding item to cart:', error);" >> src/server-ts.ts && \
    echo "    res.status(500).json({ error: 'Failed to add item to cart' });" >> src/server-ts.ts && \
    echo "  }" >> src/server-ts.ts && \
    echo "});" >> src/server-ts.ts && \
    echo "" >> src/server-ts.ts && \
    echo "// Update cart item" >> src/server-ts.ts && \
    echo "app.put('/api/cart/items/:itemId', (req, res) => {" >> src/server-ts.ts && \
    echo "  const rawItemId = req.params.itemId;" >> src/server-ts.ts && \
    echo "  const { quantity } = req.body;" >> src/server-ts.ts && \
    echo "  console.log('Update cart request received:', { itemId: rawItemId, quantity, currentCartItems: cartItems.length, cartItemIds: cartItems.map(item => item.itemId) });" >> src/server-ts.ts && \
    echo "" >> src/server-ts.ts && \
    echo "  if (!rawItemId) {" >> src/server-ts.ts && \
    echo "    console.log('Missing item ID');" >> src/server-ts.ts && \
    echo "    return res.status(400).json({ error: 'Item ID is required' });" >> src/server-ts.ts && \
    echo "  }" >> src/server-ts.ts && \
    echo "" >> src/server-ts.ts && \
    echo "  if (quantity === undefined || quantity === null) {" >> src/server-ts.ts && \
    echo "    console.log('Update rejected: Missing quantity');" >> src/server-ts.ts && \
    echo "    return res.status(400).json({ error: 'Quantity is required' });" >> src/server-ts.ts && \
    echo "  }" >> src/server-ts.ts && \
    echo "" >> src/server-ts.ts && \
    echo "  try {" >> src/server-ts.ts && \
    echo "    // Find the item in the cart using the frontend's item ID" >> src/server-ts.ts && \
    echo "    const itemIndex = cartItems.findIndex(item => item.itemId === rawItemId);" >> src/server-ts.ts && \
    echo "    console.log('Item lookup result:', { requestedItemId: rawItemId, foundIndex: itemIndex, matchedItem: itemIndex >= 0 ? cartItems[itemIndex] : null, allItemIds: cartItems.map(item => item.itemId) });" >> src/server-ts.ts && \
    echo "" >> src/server-ts.ts && \
    echo "    if (itemIndex === -1) {" >> src/server-ts.ts && \
    echo "      console.log('Item not found in cart. Available items:', JSON.stringify(cartItems.map(item => ({ itemId: item.itemId, productId: item.productId, name: item.name })), null, 2));" >> src/server-ts.ts && \
    echo "      return res.status(404).json({ error: 'Item not found in cart' });" >> src/server-ts.ts && \
    echo "    }" >> src/server-ts.ts && \
    echo "" >> src/server-ts.ts && \
    echo "    // Update the quantity" >> src/server-ts.ts && \
    echo "    const oldQuantity = cartItems[itemIndex].quantity;" >> src/server-ts.ts && \
    echo "    cartItems[itemIndex].quantity = Number(quantity);" >> src/server-ts.ts && \
    echo "    console.log('Updated item quantity:', { itemId: rawItemId, oldQuantity, newQuantity: cartItems[itemIndex].quantity, updatedItem: cartItems[itemIndex] });" >> src/server-ts.ts && \
    echo "" >> src/server-ts.ts && \
    echo "    // Return updated cart" >> src/server-ts.ts && \
    echo "    const updatedCart = {" >> src/server-ts.ts && \
    echo "      items: cartItems," >> src/server-ts.ts && \
    echo "      subtotal: calculateSubtotal(cartItems)," >> src/server-ts.ts && \
    echo "      tax: calculateTax(cartItems)," >> src/server-ts.ts && \
    echo "      total: calculateTotal(cartItems)," >> src/server-ts.ts && \
    echo "      updatedItem: cartItems[itemIndex]" >> src/server-ts.ts && \
    echo "    };" >> src/server-ts.ts && \
    echo "    console.log('Returning updated cart:', JSON.stringify(updatedCart, null, 2));" >> src/server-ts.ts && \
    echo "    return res.json(updatedCart);" >> src/server-ts.ts && \
    echo "  } catch (error) {" >> src/server-ts.ts && \
    echo "    console.error('Error updating cart:', error);" >> src/server-ts.ts && \
    echo "    return res.status(500).json({ error: 'Failed to update cart' });" >> src/server-ts.ts && \
    echo "  }" >> src/server-ts.ts && \
    echo "});" >> src/server-ts.ts && \
    echo "" >> src/server-ts.ts && \
    echo "// Remove item from cart" >> src/server-ts.ts && \
    echo "app.delete('/api/cart/items/:itemId', (req, res) => {" >> src/server-ts.ts && \
    echo "  const rawItemId = req.params.itemId;" >> src/server-ts.ts && \
    echo "  console.log('Removing item from cart:', { rawItemId });" >> src/server-ts.ts && \
    echo "  console.log('Current cart items:', cartItems.map(item => ({" >> src/server-ts.ts && \
    echo "    productId: item.productId," >> src/server-ts.ts && \
    echo "    itemId: item.itemId" >> src/server-ts.ts && \
    echo "  })));" >> src/server-ts.ts && \
    echo "" >> src/server-ts.ts && \
    echo "  try {" >> src/server-ts.ts && \
    echo "    // Count before removal" >> src/server-ts.ts && \
    echo "    const countBefore = cartItems.length;" >> src/server-ts.ts && \
    echo "" >> src/server-ts.ts && \
    echo "    // Remove the item from the cart using the frontend's item ID" >> src/server-ts.ts && \
    echo "    cartItems = cartItems.filter(item => item.itemId !== rawItemId);" >> src/server-ts.ts && \
    echo "" >> src/server-ts.ts && \
    echo "    // Count after removal" >> src/server-ts.ts && \
    echo "    const countAfter = cartItems.length;" >> src/server-ts.ts && \
    echo "    console.log(\`Removed \${countBefore - countAfter} items from cart\`);" >> src/server-ts.ts && \
    echo "" >> src/server-ts.ts && \
    echo "    // Return updated cart" >> src/server-ts.ts && \
    echo "    return res.json({" >> src/server-ts.ts && \
    echo "      items: cartItems," >> src/server-ts.ts && \
    echo "      subtotal: calculateSubtotal(cartItems)," >> src/server-ts.ts && \
    echo "      tax: calculateTax(cartItems)," >> src/server-ts.ts && \
    echo "      total: calculateTotal(cartItems)" >> src/server-ts.ts && \
    echo "    });" >> src/server-ts.ts && \
    echo "  } catch (error) {" >> src/server-ts.ts && \
    echo "    console.error('Error removing item from cart:', error);" >> src/server-ts.ts && \
    echo "    return res.status(500).json({ error: 'Failed to remove item from cart' });" >> src/server-ts.ts && \
    echo "  }" >> src/server-ts.ts && \
    echo "});" >> src/server-ts.ts && \
    echo "" >> src/server-ts.ts && \
    echo "// Clear cart" >> src/server-ts.ts && \
    echo "app.delete('/api/cart', (req, res) => {" >> src/server-ts.ts && \
    echo "  console.log('Clearing cart');" >> src/server-ts.ts && \
    echo "  cartItems = [];" >> src/server-ts.ts && \
    echo "" >> src/server-ts.ts && \
    echo "  // Return empty cart" >> src/server-ts.ts && \
    echo "  res.json({" >> src/server-ts.ts && \
    echo "    items: []," >> src/server-ts.ts && \
    echo "    subtotal: 0," >> src/server-ts.ts && \
    echo "    tax: 0," >> src/server-ts.ts && \
    echo "    total: 0" >> src/server-ts.ts && \
    echo "  });" >> src/server-ts.ts && \
    echo "});" >> src/server-ts.ts && \
    echo "" >> src/server-ts.ts && \
    echo "// Helper functions" >> src/server-ts.ts && \
    echo "function calculateSubtotal(items) {" >> src/server-ts.ts && \
    echo "  return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);" >> src/server-ts.ts && \
    echo "}" >> src/server-ts.ts && \
    echo "" >> src/server-ts.ts && \
    echo "function calculateTax(items) {" >> src/server-ts.ts && \
    echo "  const subtotal = calculateSubtotal(items);" >> src/server-ts.ts && \
    echo "  return subtotal * 0.08; // 8% tax rate" >> src/server-ts.ts && \
    echo "}" >> src/server-ts.ts && \
    echo "" >> src/server-ts.ts && \
    echo "function calculateTotal(items) {" >> src/server-ts.ts && \
    echo "  const subtotal = calculateSubtotal(items);" >> src/server-ts.ts && \
    echo "  const tax = calculateTax(items);" >> src/server-ts.ts && \
    echo "  return subtotal + tax;" >> src/server-ts.ts && \
    echo "}" >> src/server-ts.ts && \
    echo "" >> src/server-ts.ts && \
    echo "// Start server" >> src/server-ts.ts && \
    echo "app.listen(port, () => {" >> src/server-ts.ts && \
    echo "  console.log(`Server running on port ${port}`);" >> src/server-ts.ts && \
    echo "});" >> src/server-ts.ts && \
    echo "" >> src/server-ts.ts && \
    echo "module.exports = app;" >> src/server-ts.ts

# Also create a plain JavaScript version of the server file
RUN cp src/server-ts.ts src/server.js

# Update package.json to include a plain js start script
RUN node -e "const pkg = require('./package.json'); pkg.scripts['start-js'] = 'node src/server.js'; require('fs').writeFileSync('./package.json', JSON.stringify(pkg, null, 2));"

# Debug: Show the created file
RUN cat src/server-ts.ts

# Debug: List files in src directory
RUN echo "Files in src directory:" && ls -la src/

# Expose port
EXPOSE 8080

# Command to start the application using npm start
CMD ["npm", "run", "start-js"] 