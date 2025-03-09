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

# Create a simple server file directly
RUN echo "import express from 'express';" > src/server-ts.ts && \
    echo "import mongoose from 'mongoose';" >> src/server-ts.ts && \
    echo "import cors from 'cors';" >> src/server-ts.ts && \
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
    echo "app.get('/api/products', async (req, res) => {" >> src/server-ts.ts && \
    echo "  try {" >> src/server-ts.ts && \
    echo "    const Product = mongoose.model('Product', new mongoose.Schema({" >> src/server-ts.ts && \
    echo "      name: String," >> src/server-ts.ts && \
    echo "      description: String," >> src/server-ts.ts && \
    echo "      price: Number," >> src/server-ts.ts && \
    echo "      image: String," >> src/server-ts.ts && \
    echo "      category: String," >> src/server-ts.ts && \
    echo "      isFeatured: Boolean," >> src/server-ts.ts && \
    echo "      featured: Boolean," >> src/server-ts.ts && \
    echo "      is_featured: Boolean," >> src/server-ts.ts && \
    echo "      rating: Number," >> src/server-ts.ts && \
    echo "      reviews: Number," >> src/server-ts.ts && \
    echo "      stock: Number," >> src/server-ts.ts && \
    echo "      inStock: Boolean" >> src/server-ts.ts && \
    echo "    }), 'Product');" >> src/server-ts.ts && \
    echo "    const products = await Product.find();" >> src/server-ts.ts && \
    echo "    res.json(products);" >> src/server-ts.ts && \
    echo "  } catch (error) {" >> src/server-ts.ts && \
    echo "    console.error('Error fetching products:', error);" >> src/server-ts.ts && \
    echo "    res.status(500).json({ error: 'Failed to fetch products' });" >> src/server-ts.ts && \
    echo "  }" >> src/server-ts.ts && \
    echo "});" >> src/server-ts.ts && \
    echo "" >> src/server-ts.ts && \
    echo "// Start server" >> src/server-ts.ts && \
    echo "app.listen(port, () => {" >> src/server-ts.ts && \
    echo "  console.log(`Server running on port ${port}`);" >> src/server-ts.ts && \
    echo "});" >> src/server-ts.ts && \
    echo "" >> src/server-ts.ts && \
    echo "export default app;" >> src/server-ts.ts

# Debug: Show the created file
RUN cat src/server-ts.ts

# Debug: List files in src directory
RUN echo "Files in src directory:" && ls -la src/

# Expose port
EXPOSE 8080

# Command to start the application using npm start
CMD ["npm", "run", "start"] 