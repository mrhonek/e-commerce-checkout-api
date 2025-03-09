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
    echo "// Middleware" >> src/server-ts.ts && \
    echo "app.use(cors());" >> src/server-ts.ts && \
    echo "app.use(express.json());" >> src/server-ts.ts && \
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
    echo "    const products = await Product.find();" >> src/server-ts.ts && \
    echo "    console.log('Found products:', products.length);" >> src/server-ts.ts && \
    echo "    res.json(products);" >> src/server-ts.ts && \
    echo "  } catch (error) {" >> src/server-ts.ts && \
    echo "    console.error('Error fetching products:', error);" >> src/server-ts.ts && \
    echo "    res.status(500).json({ error: 'Failed to fetch products' });" >> src/server-ts.ts && \
    echo "  }" >> src/server-ts.ts && \
    echo "});" >> src/server-ts.ts && \
    echo "" >> src/server-ts.ts && \
    echo "// Cart routes" >> src/server-ts.ts && \
    echo "// Mock cart data - in a real app, this would be stored in a database" >> src/server-ts.ts && \
    echo "let cartItems = [];" >> src/server-ts.ts && \
    echo "" >> src/server-ts.ts && \
    echo "// Get cart items" >> src/server-ts.ts && \
    echo "app.get('/api/cart', (req, res) => {" >> src/server-ts.ts && \
    echo "  console.log('Cart requested');" >> src/server-ts.ts && \
    echo "  const cart = {" >> src/server-ts.ts && \
    echo "    items: cartItems," >> src/server-ts.ts && \
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
    echo "  console.log('Adding to cart:', { productId, name, quantity, price });" >> src/server-ts.ts && \
    echo "  " >> src/server-ts.ts && \
    echo "  if (!productId || !name || !price || !quantity) {" >> src/server-ts.ts && \
    echo "    return res.status(400).json({ message: 'Missing required fields' });" >> src/server-ts.ts && \
    echo "  }" >> src/server-ts.ts && \
    echo "" >> src/server-ts.ts && \
    echo "  // Check if item already exists in cart" >> src/server-ts.ts && \
    echo "  const existingItemIndex = cartItems.findIndex(item => item.productId === productId);" >> src/server-ts.ts && \
    echo "" >> src/server-ts.ts && \
    echo "  if (existingItemIndex >= 0) {" >> src/server-ts.ts && \
    echo "    // Update quantity if item exists" >> src/server-ts.ts && \
    echo "    cartItems[existingItemIndex].quantity += quantity;" >> src/server-ts.ts && \
    echo "  } else {" >> src/server-ts.ts && \
    echo "    // Add new item if it doesn't exist" >> src/server-ts.ts && \
    echo "    cartItems.push({" >> src/server-ts.ts && \
    echo "      productId," >> src/server-ts.ts && \
    echo "      name," >> src/server-ts.ts && \
    echo "      price," >> src/server-ts.ts && \
    echo "      quantity," >> src/server-ts.ts && \
    echo "      image" >> src/server-ts.ts && \
    echo "    });" >> src/server-ts.ts && \
    echo "  }" >> src/server-ts.ts && \
    echo "" >> src/server-ts.ts && \
    echo "  // Return updated cart" >> src/server-ts.ts && \
    echo "  res.status(201).json({" >> src/server-ts.ts && \
    echo "    items: cartItems," >> src/server-ts.ts && \
    echo "    subtotal: calculateSubtotal(cartItems)," >> src/server-ts.ts && \
    echo "    tax: calculateTax(cartItems)," >> src/server-ts.ts && \
    echo "    total: calculateTotal(cartItems)" >> src/server-ts.ts && \
    echo "  });" >> src/server-ts.ts && \
    echo "});" >> src/server-ts.ts && \
    echo "" >> src/server-ts.ts && \
    echo "// Update cart item" >> src/server-ts.ts && \
    echo "app.put('/api/cart/items/:itemId', (req, res) => {" >> src/server-ts.ts && \
    echo "  const { itemId } = req.params;" >> src/server-ts.ts && \
    echo "  const { quantity } = req.body;" >> src/server-ts.ts && \
    echo "  console.log('Updating cart item:', { itemId, quantity });" >> src/server-ts.ts && \
    echo "" >> src/server-ts.ts && \
    echo "  if (!quantity) {" >> src/server-ts.ts && \
    echo "    return res.status(400).json({ message: 'Quantity is required' });" >> src/server-ts.ts && \
    echo "  }" >> src/server-ts.ts && \
    echo "" >> src/server-ts.ts && \
    echo "  // Find the item in the cart" >> src/server-ts.ts && \
    echo "  const itemIndex = cartItems.findIndex(item => item.productId === itemId);" >> src/server-ts.ts && \
    echo "" >> src/server-ts.ts && \
    echo "  if (itemIndex === -1) {" >> src/server-ts.ts && \
    echo "    return res.status(404).json({ message: 'Item not found in cart' });" >> src/server-ts.ts && \
    echo "  }" >> src/server-ts.ts && \
    echo "" >> src/server-ts.ts && \
    echo "  // Update the quantity" >> src/server-ts.ts && \
    echo "  cartItems[itemIndex].quantity = quantity;" >> src/server-ts.ts && \
    echo "" >> src/server-ts.ts && \
    echo "  // Return updated cart" >> src/server-ts.ts && \
    echo "  res.json({" >> src/server-ts.ts && \
    echo "    items: cartItems," >> src/server-ts.ts && \
    echo "    subtotal: calculateSubtotal(cartItems)," >> src/server-ts.ts && \
    echo "    tax: calculateTax(cartItems)," >> src/server-ts.ts && \
    echo "    total: calculateTotal(cartItems)" >> src/server-ts.ts && \
    echo "  });" >> src/server-ts.ts && \
    echo "});" >> src/server-ts.ts && \
    echo "" >> src/server-ts.ts && \
    echo "// Remove item from cart" >> src/server-ts.ts && \
    echo "app.delete('/api/cart/items/:itemId', (req, res) => {" >> src/server-ts.ts && \
    echo "  const { itemId } = req.params;" >> src/server-ts.ts && \
    echo "  console.log('Removing item from cart:', itemId);" >> src/server-ts.ts && \
    echo "" >> src/server-ts.ts && \
    echo "  // Remove the item from the cart" >> src/server-ts.ts && \
    echo "  cartItems = cartItems.filter(item => item.productId !== itemId);" >> src/server-ts.ts && \
    echo "" >> src/server-ts.ts && \
    echo "  // Return updated cart" >> src/server-ts.ts && \
    echo "  res.json({" >> src/server-ts.ts && \
    echo "    items: cartItems," >> src/server-ts.ts && \
    echo "    subtotal: calculateSubtotal(cartItems)," >> src/server-ts.ts && \
    echo "    tax: calculateTax(cartItems)," >> src/server-ts.ts && \
    echo "    total: calculateTotal(cartItems)" >> src/server-ts.ts && \
    echo "  });" >> src/server-ts.ts && \
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