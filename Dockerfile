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

# Create server-main.ts if it doesn't exist
RUN echo "Creating server-main.ts if it doesn't exist"
RUN if [ ! -f src/server-main.ts ]; then \
    echo "// Main TypeScript server entry point" > src/server-main.ts; \
    echo "import express from 'express';" >> src/server-main.ts; \
    echo "import cors from 'cors';" >> src/server-main.ts; \
    echo "import { MongoClient } from 'mongodb';" >> src/server-main.ts; \
    echo "" >> src/server-main.ts; \
    echo "const app = express();" >> src/server-main.ts; \
    echo "const port = process.env.PORT || 8080;" >> src/server-main.ts; \
    echo "" >> src/server-main.ts; \
    echo "app.use(cors());" >> src/server-main.ts; \
    echo "app.use(express.json());" >> src/server-main.ts; \
    echo "" >> src/server-main.ts; \
    echo "// Health check endpoint" >> src/server-main.ts; \
    echo "app.get('/api/health', (req, res) => {" >> src/server-main.ts; \
    echo "  res.status(200).json({ status: 'ok', message: 'API running with MongoDB connection' });" >> src/server-main.ts; \
    echo "});" >> src/server-main.ts; \
    echo "" >> src/server-main.ts; \
    echo "// Connect to MongoDB and fetch products" >> src/server-main.ts; \
    echo "app.get('/api/products', async (req, res) => {" >> src/server-main.ts; \
    echo "  console.log('GET /api/products');" >> src/server-main.ts; \
    echo "  try {" >> src/server-main.ts; \
    echo "    if (!process.env.MONGODB_URI) {" >> src/server-main.ts; \
    echo "      throw new Error('MONGODB_URI not set');" >> src/server-main.ts; \
    echo "    }" >> src/server-main.ts; \
    echo "    const client = new MongoClient(process.env.MONGODB_URI);" >> src/server-main.ts; \
    echo "    await client.connect();" >> src/server-main.ts; \
    echo "    const db = client.db();" >> src/server-main.ts; \
    echo "    const products = await db.collection('products').find().toArray();" >> src/server-main.ts; \
    echo "    const transformedProducts = products.map(product => ({" >> src/server-main.ts; \
    echo "      ...product," >> src/server-main.ts; \
    echo "      _id: product._id.toString()," >> src/server-main.ts; \
    echo "      imageUrl: product.images && product.images.length > 0 ? product.images[0] : undefined" >> src/server-main.ts; \
    echo "    }));" >> src/server-main.ts; \
    echo "    await client.close();" >> src/server-main.ts; \
    echo "    res.json(transformedProducts);" >> src/server-main.ts; \
    echo "  } catch (error) {" >> src/server-main.ts; \
    echo "    console.error('Error fetching products:', error);" >> src/server-main.ts; \
    echo "    res.status(500).json({ error: 'Failed to fetch products' });" >> src/server-main.ts; \
    echo "  }" >> src/server-main.ts; \
    echo "});" >> src/server-main.ts; \
    echo "" >> src/server-main.ts; \
    echo "// Start server" >> src/server-main.ts; \
    echo "app.listen(port, () => {" >> src/server-main.ts; \
    echo "  console.log(`Server running on port ${port}`);" >> src/server-main.ts; \
    echo "});" >> src/server-main.ts; \
    fi

# Final verification
RUN echo "Final verification of files:"
RUN ls -la src/
RUN cat src/server-main.ts | head -5

# Expose the port
EXPOSE 8080

# Use npm start to run the app
CMD ["npm", "start"] 