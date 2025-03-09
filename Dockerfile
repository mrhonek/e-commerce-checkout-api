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

# Create server.js directly (avoiding TypeScript compilation issues completely)
RUN echo "Creating server.js to avoid TypeScript issues"
RUN echo "// Simple Express server with MongoDB connection" > src/server.js
RUN echo "const express = require('express');" >> src/server.js
RUN echo "const cors = require('cors');" >> src/server.js
RUN echo "const { MongoClient, ObjectId } = require('mongodb');" >> src/server.js
RUN echo "" >> src/server.js
RUN echo "const app = express();" >> src/server.js
RUN echo "const port = process.env.PORT || 8080;" >> src/server.js
RUN echo "" >> src/server.js
RUN echo "console.log('=== Starting server with direct Node.js ===');" >> src/server.js
RUN echo "console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);" >> src/server.js
RUN echo "console.log('NODE_ENV:', process.env.NODE_ENV);" >> src/server.js
RUN echo "" >> src/server.js
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
RUN echo "  res.status(200).json({ status: 'ok', message: 'API running with MongoDB connection' });" >> src/server.js
RUN echo "});" >> src/server.js
RUN echo "" >> src/server.js
RUN echo "// Connect to MongoDB and fetch products" >> src/server.js
RUN echo "app.get('/api/products', async (req, res) => {" >> src/server.js
RUN echo "  console.log('GET /api/products');" >> src/server.js
RUN echo "  try {" >> src/server.js
RUN echo "    if (!process.env.MONGODB_URI) {" >> src/server.js
RUN echo "      throw new Error('MONGODB_URI not set');" >> src/server.js
RUN echo "    }" >> src/server.js
RUN echo "    const client = new MongoClient(process.env.MONGODB_URI);" >> src/server.js
RUN echo "    await client.connect();" >> src/server.js
RUN echo "    console.log('Successfully connected to MongoDB');" >> src/server.js
RUN echo "" >> src/server.js
RUN echo "    const db = client.db();" >> src/server.js
RUN echo "    const products = await db.collection('products').find().toArray();" >> src/server.js
RUN echo "    console.log(`Found ${products.length} products in database`);" >> src/server.js
RUN echo "" >> src/server.js
RUN echo "    // Transform products for frontend compatibility" >> src/server.js
RUN echo "    const transformedProducts = products.map(product => ({" >> src/server.js
RUN echo "      ...product," >> src/server.js
RUN echo "      _id: product._id.toString()," >> src/server.js
RUN echo "      imageUrl: product.images && product.images.length > 0 ? product.images[0] : undefined" >> src/server.js
RUN echo "    }));" >> src/server.js
RUN echo "" >> src/server.js
RUN echo "    if (transformedProducts.length > 0) {" >> src/server.js
RUN echo "      console.log('Sample product:', {" >> src/server.js
RUN echo "        _id: transformedProducts[0]._id," >> src/server.js
RUN echo "        name: transformedProducts[0].name," >> src/server.js
RUN echo "        imageUrl: transformedProducts[0].imageUrl" >> src/server.js
RUN echo "      });" >> src/server.js
RUN echo "    }" >> src/server.js
RUN echo "" >> src/server.js
RUN echo "    await client.close();" >> src/server.js
RUN echo "    res.json(transformedProducts);" >> src/server.js
RUN echo "  } catch (error) {" >> src/server.js
RUN echo "    console.error('Error fetching products:', error);" >> src/server.js
RUN echo "    res.status(500).json({ error: 'Failed to fetch products' });" >> src/server.js
RUN echo "  }" >> src/server.js
RUN echo "});" >> src/server.js
RUN echo "" >> src/server.js
RUN echo "// Featured products endpoint" >> src/server.js
RUN echo "app.get('/api/products/featured', async (req, res) => {" >> src/server.js
RUN echo "  console.log('GET /api/products/featured');" >> src/server.js
RUN echo "  try {" >> src/server.js
RUN echo "    if (!process.env.MONGODB_URI) {" >> src/server.js
RUN echo "      throw new Error('MONGODB_URI not set');" >> src/server.js
RUN echo "    }" >> src/server.js
RUN echo "    const client = new MongoClient(process.env.MONGODB_URI);" >> src/server.js
RUN echo "    await client.connect();" >> src/server.js
RUN echo "" >> src/server.js
RUN echo "    const db = client.db();" >> src/server.js
RUN echo "    const products = await db.collection('products').find({ isFeatured: true }).toArray();" >> src/server.js
RUN echo "    console.log(`Found ${products.length} featured products in database`);" >> src/server.js
RUN echo "" >> src/server.js
RUN echo "    const transformedProducts = products.map(product => ({" >> src/server.js
RUN echo "      ...product," >> src/server.js
RUN echo "      _id: product._id.toString()," >> src/server.js
RUN echo "      imageUrl: product.images && product.images.length > 0 ? product.images[0] : undefined" >> src/server.js
RUN echo "    }));" >> src/server.js
RUN echo "" >> src/server.js
RUN echo "    await client.close();" >> src/server.js
RUN echo "    res.json(transformedProducts);" >> src/server.js
RUN echo "  } catch (error) {" >> src/server.js
RUN echo "    console.error('Error fetching featured products:', error);" >> src/server.js
RUN echo "    res.status(500).json({ error: 'Failed to fetch featured products' });" >> src/server.js
RUN echo "  }" >> src/server.js
RUN echo "});" >> src/server.js
RUN echo "" >> src/server.js
RUN echo "// Single product endpoint" >> src/server.js
RUN echo "app.get('/api/products/:id', async (req, res) => {" >> src/server.js
RUN echo "  const id = req.params.id;" >> src/server.js
RUN echo "  console.log(`GET /api/products/${id}`);" >> src/server.js
RUN echo "" >> src/server.js
RUN echo "  try {" >> src/server.js
RUN echo "    if (!process.env.MONGODB_URI) {" >> src/server.js
RUN echo "      throw new Error('MONGODB_URI not set');" >> src/server.js
RUN echo "    }" >> src/server.js
RUN echo "    const client = new MongoClient(process.env.MONGODB_URI);" >> src/server.js
RUN echo "    await client.connect();" >> src/server.js
RUN echo "" >> src/server.js
RUN echo "    const db = client.db();" >> src/server.js
RUN echo "    let product;" >> src/server.js
RUN echo "" >> src/server.js
RUN echo "    // Check if ID is a valid MongoDB ObjectId" >> src/server.js
RUN echo "    if (id.match(/^[0-9a-fA-F]{24}$/)) {" >> src/server.js
RUN echo "      product = await db.collection('products').findOne({ _id: new ObjectId(id) });" >> src/server.js
RUN echo "    } else {" >> src/server.js
RUN echo "      // Try by slug" >> src/server.js
RUN echo "      product = await db.collection('products').findOne({ slug: id });" >> src/server.js
RUN echo "    }" >> src/server.js
RUN echo "" >> src/server.js
RUN echo "    if (!product) {" >> src/server.js
RUN echo "      await client.close();" >> src/server.js
RUN echo "      return res.status(404).json({ error: 'Product not found' });" >> src/server.js
RUN echo "    }" >> src/server.js
RUN echo "" >> src/server.js
RUN echo "    const transformedProduct = {" >> src/server.js
RUN echo "      ...product," >> src/server.js
RUN echo "      _id: product._id.toString()," >> src/server.js
RUN echo "      imageUrl: product.images && product.images.length > 0 ? product.images[0] : undefined" >> src/server.js
RUN echo "    };" >> src/server.js
RUN echo "" >> src/server.js
RUN echo "    await client.close();" >> src/server.js
RUN echo "    res.json(transformedProduct);" >> src/server.js
RUN echo "  } catch (error) {" >> src/server.js
RUN echo "    console.error(`Error fetching product ${id}:`, error);" >> src/server.js
RUN echo "    res.status(500).json({ error: 'Failed to fetch product' });" >> src/server.js
RUN echo "  }" >> src/server.js
RUN echo "});" >> src/server.js
RUN echo "" >> src/server.js
RUN echo "// Start server" >> src/server.js
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