FROM node:20.11.1-alpine3.19

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Debug what's in the build context first
RUN echo "Files in build context:"
RUN ls -la

# Copy all source files
COPY . .

# Debug: List files to verify structure after copying
RUN echo "After COPY . . - root directory:"
RUN ls -la
RUN echo "Checking if src directory exists:"
RUN ls -la src || echo "src directory not found, creating it"

# Create src directory if it doesn't exist
RUN mkdir -p src

# Create server.js directly with a more comprehensive implementation
RUN echo "Creating enhanced server.js file"
RUN echo "// Simple Express server with MongoDB connection" > src/server.js
RUN echo "const express = require('express');" >> src/server.js
RUN echo "const cors = require('cors');" >> src/server.js
RUN echo "const { MongoClient, ObjectId } = require('mongodb');" >> src/server.js
RUN echo "" >> src/server.js
RUN echo "const app = express();" >> src/server.js
RUN echo "const port = process.env.PORT || 8080;" >> src/server.js
RUN echo "" >> src/server.js
RUN echo "// Logging startup info" >> src/server.js
RUN echo "console.log('=== E-Commerce Checkout API ===');" >> src/server.js
RUN echo "console.log('NODE_ENV:', process.env.NODE_ENV);" >> src/server.js
RUN echo "console.log('PORT:', process.env.PORT);" >> src/server.js
RUN echo "console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);" >> src/server.js
RUN echo "console.log('=============================');" >> src/server.js
RUN echo "" >> src/server.js
RUN echo "// Middleware" >> src/server.js
RUN echo "app.use(cors());" >> src/server.js
RUN echo "app.use(express.json());" >> src/server.js
RUN echo "" >> src/server.js
RUN echo "// Additional CORS headers" >> src/server.js
RUN echo "app.use((req, res, next) => {" >> src/server.js
RUN echo "  res.header('Access-Control-Allow-Origin', '*');" >> src/server.js
RUN echo "  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');" >> src/server.js
RUN echo "  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');" >> src/server.js
RUN echo "  if (req.method === 'OPTIONS') {" >> src/server.js
RUN echo "    return res.status(200).end();" >> src/server.js
RUN echo "  }" >> src/server.js
RUN echo "  next();" >> src/server.js
RUN echo "});" >> src/server.js
RUN echo "" >> src/server.js
RUN echo "// Health check endpoint" >> src/server.js
RUN echo "app.get('/api/health', (req, res) => {" >> src/server.js
RUN echo "  res.status(200).json({ " >> src/server.js
RUN echo "    status: 'ok', " >> src/server.js
RUN echo "    message: 'API running'," >> src/server.js
RUN echo "    mongodb: !!process.env.MONGODB_URI," >> src/server.js
RUN echo "    env: process.env.NODE_ENV || 'development'" >> src/server.js
RUN echo "  });" >> src/server.js
RUN echo "});" >> src/server.js
RUN echo "" >> src/server.js
RUN echo "// MongoDB client helper" >> src/server.js
RUN echo "async function connectToMongo() {" >> src/server.js
RUN echo "  if (!process.env.MONGODB_URI) {" >> src/server.js
RUN echo "    throw new Error('MONGODB_URI environment variable is not set');" >> src/server.js
RUN echo "  }" >> src/server.js
RUN echo "  " >> src/server.js
RUN echo "  try {" >> src/server.js
RUN echo "    const client = new MongoClient(process.env.MONGODB_URI);" >> src/server.js
RUN echo "    await client.connect();" >> src/server.js
RUN echo "    console.log('Successfully connected to MongoDB');" >> src/server.js
RUN echo "    return client;" >> src/server.js
RUN echo "  } catch (error) {" >> src/server.js
RUN echo "    console.error('Failed to connect to MongoDB:', error);" >> src/server.js
RUN echo "    throw error;" >> src/server.js
RUN echo "  }" >> src/server.js
RUN echo "}" >> src/server.js
RUN echo "" >> src/server.js
RUN echo "// Get all products" >> src/server.js
RUN echo "app.get('/api/products', async (req, res) => {" >> src/server.js
RUN echo "  console.log('GET /api/products');" >> src/server.js
RUN echo "  " >> src/server.js
RUN echo "  try {" >> src/server.js
RUN echo "    const client = await connectToMongo();" >> src/server.js
RUN echo "    const db = client.db();" >> src/server.js
RUN echo "    const products = await db.collection('products').find().toArray();" >> src/server.js
RUN echo "    console.log(`Found ${products.length} products in database`);" >> src/server.js
RUN echo "    " >> src/server.js
RUN echo "    // Transform products for frontend compatibility" >> src/server.js
RUN echo "    const transformedProducts = products.map(product => ({" >> src/server.js
RUN echo "      ...product," >> src/server.js
RUN echo "      _id: product._id.toString()," >> src/server.js
RUN echo "      imageUrl: product.images && product.images.length > 0 ? product.images[0] : undefined" >> src/server.js
RUN echo "    }));" >> src/server.js
RUN echo "    " >> src/server.js
RUN echo "    if (transformedProducts.length > 0) {" >> src/server.js
RUN echo "      console.log('Sample product:', {" >> src/server.js
RUN echo "        _id: transformedProducts[0]._id," >> src/server.js
RUN echo "        name: transformedProducts[0].name" >> src/server.js
RUN echo "      });" >> src/server.js
RUN echo "    }" >> src/server.js
RUN echo "    " >> src/server.js
RUN echo "    await client.close();" >> src/server.js
RUN echo "    res.json(transformedProducts);" >> src/server.js
RUN echo "  } catch (error) {" >> src/server.js
RUN echo "    console.error('Error fetching products:', error);" >> src/server.js
RUN echo "    " >> src/server.js
RUN echo "    // Fallback to mock products for development/demo" >> src/server.js
RUN echo "    const mockProducts = [" >> src/server.js
RUN echo "      { _id: \"prod1\", name: \"Office Chair\", price: 249.99, isFeatured: true, imageUrl: \"https://via.placeholder.com/400x300/3498db/ffffff?text=Office+Chair\" }," >> src/server.js
RUN echo "      { _id: \"prod2\", name: \"Headphones\", price: 199.99, isFeatured: true, imageUrl: \"https://via.placeholder.com/400x300/e74c3c/ffffff?text=Headphones\" }" >> src/server.js
RUN echo "    ];" >> src/server.js
RUN echo "    console.log('Returning mock products as fallback');" >> src/server.js
RUN echo "    res.json(mockProducts);" >> src/server.js
RUN echo "  }" >> src/server.js
RUN echo "});" >> src/server.js
RUN echo "" >> src/server.js
RUN echo "// Get featured products" >> src/server.js
RUN echo "app.get('/api/products/featured', async (req, res) => {" >> src/server.js
RUN echo "  console.log('GET /api/products/featured');" >> src/server.js
RUN echo "  " >> src/server.js
RUN echo "  try {" >> src/server.js
RUN echo "    const client = await connectToMongo();" >> src/server.js
RUN echo "    const db = client.db();" >> src/server.js
RUN echo "    const products = await db.collection('products').find({ isFeatured: true }).toArray();" >> src/server.js
RUN echo "    console.log(`Found ${products.length} featured products in database`);" >> src/server.js
RUN echo "    " >> src/server.js
RUN echo "    const transformedProducts = products.map(product => ({" >> src/server.js
RUN echo "      ...product," >> src/server.js
RUN echo "      _id: product._id.toString()," >> src/server.js
RUN echo "      imageUrl: product.images && product.images.length > 0 ? product.images[0] : undefined" >> src/server.js
RUN echo "    }));" >> src/server.js
RUN echo "    " >> src/server.js
RUN echo "    await client.close();" >> src/server.js
RUN echo "    res.json(transformedProducts);" >> src/server.js
RUN echo "  } catch (error) {" >> src/server.js
RUN echo "    console.error('Error fetching featured products:', error);" >> src/server.js
RUN echo "    " >> src/server.js
RUN echo "    // Fallback featured products" >> src/server.js
RUN echo "    const mockFeatured = [" >> src/server.js
RUN echo "      { _id: \"prod1\", name: \"Office Chair\", price: 249.99, isFeatured: true, imageUrl: \"https://via.placeholder.com/400x300/3498db/ffffff?text=Office+Chair\" }" >> src/server.js
RUN echo "    ];" >> src/server.js
RUN echo "    res.json(mockFeatured);" >> src/server.js
RUN echo "  }" >> src/server.js
RUN echo "});" >> src/server.js
RUN echo "" >> src/server.js
RUN echo "// Get single product by ID" >> src/server.js
RUN echo "app.get('/api/products/:id', async (req, res) => {" >> src/server.js
RUN echo "  const id = req.params.id;" >> src/server.js
RUN echo "  console.log(`GET /api/products/${id}`);" >> src/server.js
RUN echo "  " >> src/server.js
RUN echo "  try {" >> src/server.js
RUN echo "    const client = await connectToMongo();" >> src/server.js
RUN echo "    const db = client.db();" >> src/server.js
RUN echo "    let product;" >> src/server.js
RUN echo "    " >> src/server.js
RUN echo "    // Check if ID is a valid MongoDB ObjectId" >> src/server.js
RUN echo "    if (id.match(/^[0-9a-fA-F]{24}$/)) {" >> src/server.js
RUN echo "      product = await db.collection('products').findOne({ _id: new ObjectId(id) });" >> src/server.js
RUN echo "    } else {" >> src/server.js
RUN echo "      // Try by slug" >> src/server.js
RUN echo "      product = await db.collection('products').findOne({ slug: id });" >> src/server.js
RUN echo "    }" >> src/server.js
RUN echo "    " >> src/server.js
RUN echo "    if (!product) {" >> src/server.js
RUN echo "      await client.close();" >> src/server.js
RUN echo "      " >> src/server.js
RUN echo "      // If it's a mock product ID, return mock data" >> src/server.js
RUN echo "      if (id === 'prod1') {" >> src/server.js
RUN echo "        return res.json({ _id: \"prod1\", name: \"Office Chair\", price: 249.99, isFeatured: true, imageUrl: \"https://via.placeholder.com/400x300/3498db/ffffff?text=Office+Chair\" });" >> src/server.js
RUN echo "      }" >> src/server.js
RUN echo "      " >> src/server.js
RUN echo "      return res.status(404).json({ error: 'Product not found' });" >> src/server.js
RUN echo "    }" >> src/server.js
RUN echo "    " >> src/server.js
RUN echo "    const transformedProduct = {" >> src/server.js
RUN echo "      ...product," >> src/server.js
RUN echo "      _id: product._id.toString()," >> src/server.js
RUN echo "      imageUrl: product.images && product.images.length > 0 ? product.images[0] : undefined" >> src/server.js
RUN echo "    };" >> src/server.js
RUN echo "    " >> src/server.js
RUN echo "    await client.close();" >> src/server.js
RUN echo "    res.json(transformedProduct);" >> src/server.js
RUN echo "  } catch (error) {" >> src/server.js
RUN echo "    console.error(`Error fetching product ${id}:`, error);" >> src/server.js
RUN echo "    " >> src/server.js
RUN echo "    // Fallback for mock products" >> src/server.js
RUN echo "    if (id === 'prod1') {" >> src/server.js
RUN echo "      return res.json({ _id: \"prod1\", name: \"Office Chair\", price: 249.99, isFeatured: true, imageUrl: \"https://via.placeholder.com/400x300/3498db/ffffff?text=Office+Chair\" });" >> src/server.js
RUN echo "    }" >> src/server.js
RUN echo "    " >> src/server.js
RUN echo "    res.status(500).json({ error: 'Failed to fetch product' });" >> src/server.js
RUN echo "  }" >> src/server.js
RUN echo "});" >> src/server.js
RUN echo "" >> src/server.js
RUN echo "// In-memory cart storage (temporary until we implement MongoDB cart)" >> src/server.js
RUN echo "const cart = { items: [] };" >> src/server.js
RUN echo "" >> src/server.js
RUN echo "// Get cart" >> src/server.js
RUN echo "app.get('/api/cart', (req, res) => {" >> src/server.js
RUN echo "  res.json(cart);" >> src/server.js
RUN echo "});" >> src/server.js
RUN echo "" >> src/server.js
RUN echo "// Add item to cart" >> src/server.js
RUN echo "app.post('/api/cart/items', (req, res) => {" >> src/server.js
RUN echo "  const { productId, quantity = 1 } = req.body;" >> src/server.js
RUN echo "  " >> src/server.js
RUN echo "  if (!productId) {" >> src/server.js
RUN echo "    return res.status(400).json({ error: 'Product ID is required' });" >> src/server.js
RUN echo "  }" >> src/server.js
RUN echo "  " >> src/server.js
RUN echo "  const itemId = `item_${Date.now()}`;" >> src/server.js
RUN echo "  " >> src/server.js
RUN echo "  // Add item to cart (in a real app, we'd get product details from DB)" >> src/server.js
RUN echo "  const cartItem = {" >> src/server.js
RUN echo "    itemId," >> src/server.js
RUN echo "    productId," >> src/server.js
RUN echo "    quantity" >> src/server.js
RUN echo "  };" >> src/server.js
RUN echo "  " >> src/server.js
RUN echo "  cart.items.push(cartItem);" >> src/server.js
RUN echo "  res.status(201).json(cartItem);" >> src/server.js
RUN echo "});" >> src/server.js
RUN echo "" >> src/server.js
RUN echo "// Remove item from cart" >> src/server.js
RUN echo "app.delete('/api/cart/items/:itemId', (req, res) => {" >> src/server.js
RUN echo "  const { itemId } = req.params;" >> src/server.js
RUN echo "  " >> src/server.js
RUN echo "  const initialLength = cart.items.length;" >> src/server.js
RUN echo "  cart.items = cart.items.filter(item => item.itemId !== itemId);" >> src/server.js
RUN echo "  " >> src/server.js
RUN echo "  if (cart.items.length === initialLength) {" >> src/server.js
RUN echo "    return res.status(404).json({ error: 'Item not found in cart' });" >> src/server.js
RUN echo "  }" >> src/server.js
RUN echo "  " >> src/server.js
RUN echo "  res.status(200).json({ message: 'Item removed from cart' });" >> src/server.js
RUN echo "});" >> src/server.js
RUN echo "" >> src/server.js
RUN echo "// Shipping options" >> src/server.js
RUN echo "app.get('/api/shipping', (req, res) => {" >> src/server.js
RUN echo "  const shippingOptions = [" >> src/server.js
RUN echo "    { id: 'standard', name: 'Standard Shipping', price: 5.99, estimatedDays: '5-7 business days' }," >> src/server.js
RUN echo "    { id: 'express', name: 'Express Shipping', price: 12.99, estimatedDays: '2-3 business days' }," >> src/server.js
RUN echo "    { id: 'overnight', name: 'Overnight Shipping', price: 24.99, estimatedDays: '1 business day' }" >> src/server.js
RUN echo "  ];" >> src/server.js
RUN echo "  " >> src/server.js
RUN echo "  res.json(shippingOptions);" >> src/server.js
RUN echo "});" >> src/server.js
RUN echo "" >> src/server.js
RUN echo "// Payment methods" >> src/server.js
RUN echo "app.get('/api/payment/methods', (req, res) => {" >> src/server.js
RUN echo "  const paymentMethods = [" >> src/server.js
RUN echo "    { id: 'credit_card', name: 'Credit Card', icon: 'credit-card' }," >> src/server.js
RUN echo "    { id: 'paypal', name: 'PayPal', icon: 'paypal' }" >> src/server.js
RUN echo "  ];" >> src/server.js
RUN echo "  " >> src/server.js
RUN echo "  res.json(paymentMethods);" >> src/server.js
RUN echo "});" >> src/server.js
RUN echo "" >> src/server.js
RUN echo "// Process order" >> src/server.js
RUN echo "app.post('/api/orders', (req, res) => {" >> src/server.js
RUN echo "  const { cart, shipping, payment, customer } = req.body;" >> src/server.js
RUN echo "  " >> src/server.js
RUN echo "  if (!cart || !shipping || !payment || !customer) {" >> src/server.js
RUN echo "    return res.status(400).json({ error: 'Missing required order information' });" >> src/server.js
RUN echo "  }" >> src/server.js
RUN echo "  " >> src/server.js
RUN echo "  // In a real app, we would save the order to the database" >> src/server.js
RUN echo "  const orderId = `order_${Date.now()}`;" >> src/server.js
RUN echo "  " >> src/server.js
RUN echo "  // Mock order creation" >> src/server.js
RUN echo "  const order = {" >> src/server.js
RUN echo "    id: orderId," >> src/server.js
RUN echo "    created: new Date().toISOString()," >> src/server.js
RUN echo "    status: 'processing'," >> src/server.js
RUN echo "    cart," >> src/server.js
RUN echo "    shipping," >> src/server.js
RUN echo "    payment: { ...payment, cardNumber: payment.cardNumber ? '****' + payment.cardNumber.slice(-4) : null }," >> src/server.js
RUN echo "    customer" >> src/server.js
RUN echo "  };" >> src/server.js
RUN echo "  " >> src/server.js
RUN echo "  res.status(201).json(order);" >> src/server.js
RUN echo "});" >> src/server.js
RUN echo "" >> src/server.js
RUN echo "// Start the server" >> src/server.js
RUN echo "app.listen(port, () => {" >> src/server.js
RUN echo "  console.log(`Server running on port ${port}`);" >> src/server.js
RUN echo "});" >> src/server.js

# Modify package.json to use node directly with server.js
RUN echo "Modifying package.json to use direct node with server.js"
RUN sed -i 's/"start": ".*"/"start": "node src\/server.js"/g' package.json

# Final verification
RUN echo "Final verification of files:"
RUN ls -la src/
RUN cat src/server.js | head -5
RUN cat package.json | grep start

# Expose the port
EXPOSE 8080

# Use npm start to run the app
CMD ["npm", "start"] 