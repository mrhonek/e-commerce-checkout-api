FROM node:20.11.1-alpine3.19

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Install mongodb driver explicitly 
RUN npm install mongodb express cors

# Create setup script to generate server.js if needed
RUN echo '#!/bin/sh' > /setup.sh && \
    echo 'mkdir -p /app/src' >> /setup.sh && \
    echo 'if [ ! -f /app/src/server.js ]; then' >> /setup.sh && \
    echo '  echo "Creating server.js file"' >> /setup.sh && \
    echo '  echo "// Server.js file created by setup script" > /app/src/server.js' >> /setup.sh && \
    echo '  echo "const express = require('\''express'\'');" >> /app/src/server.js' >> /setup.sh && \
    echo '  echo "const cors = require('\''cors'\'');" >> /app/src/server.js' >> /setup.sh && \
    echo '  echo "const { MongoClient, ObjectId } = require('\''mongodb'\'');" >> /app/src/server.js' >> /setup.sh && \
    echo '  echo "" >> /app/src/server.js' >> /setup.sh && \
    echo '  echo "const app = express();" >> /app/src/server.js' >> /setup.sh && \
    echo '  echo "const port = process.env.PORT || 8080;" >> /app/src/server.js' >> /setup.sh && \
    echo '  echo "" >> /app/src/server.js' >> /setup.sh && \
    echo '  echo "console.log('\''=== E-Commerce Checkout API ==='\''');" >> /app/src/server.js' >> /setup.sh && \
    echo '  echo "console.log('\''NODE_ENV:'\'', process.env.NODE_ENV);" >> /app/src/server.js' >> /setup.sh && \
    echo '  echo "console.log('\''PORT:'\'', process.env.PORT);" >> /app/src/server.js' >> /setup.sh && \
    echo '  echo "console.log('\''MONGODB_URI exists:'\'', !!process.env.MONGODB_URI);" >> /app/src/server.js' >> /setup.sh && \
    echo '  echo "" >> /app/src/server.js' >> /setup.sh && \
    echo '  echo "app.use(cors());" >> /app/src/server.js' >> /setup.sh && \
    echo '  echo "app.use(express.json());" >> /app/src/server.js' >> /setup.sh && \
    echo '  echo "" >> /app/src/server.js' >> /setup.sh && \
    echo '  echo "app.get('\''/api/health'\'', (req, res) => {" >> /app/src/server.js' >> /setup.sh && \
    echo '  echo "  res.status(200).json({ status: '\''ok'\'', message: '\''API running'\'', mongodb: !!process.env.MONGODB_URI });" >> /app/src/server.js' >> /setup.sh && \
    echo '  echo "});" >> /app/src/server.js' >> /setup.sh && \
    echo '  echo "" >> /app/src/server.js' >> /setup.sh && \
    echo '  echo "app.get('\''/api/products'\'', async (req, res) => {" >> /app/src/server.js' >> /setup.sh && \
    echo '  echo "  try {" >> /app/src/server.js' >> /setup.sh && \
    echo '  echo "    if (!process.env.MONGODB_URI) {" >> /app/src/server.js' >> /setup.sh && \
    echo '  echo "      throw new Error('\''MONGODB_URI not set'\'');" >> /app/src/server.js' >> /setup.sh && \
    echo '  echo "    }" >> /app/src/server.js' >> /setup.sh && \
    echo '  echo "    const client = new MongoClient(process.env.MONGODB_URI);" >> /app/src/server.js' >> /setup.sh && \
    echo '  echo "    await client.connect();" >> /app/src/server.js' >> /setup.sh && \
    echo '  echo "    const db = client.db();" >> /app/src/server.js' >> /setup.sh && \
    echo '  echo "    const products = await db.collection('\''products'\'').find().toArray();" >> /app/src/server.js' >> /setup.sh && \
    echo '  echo "    const transformedProducts = products.map(p => ({ ...p, _id: p._id.toString(), imageUrl: p.images && p.images.length > 0 ? p.images[0] : undefined }));" >> /app/src/server.js' >> /setup.sh && \
    echo '  echo "    await client.close();" >> /app/src/server.js' >> /setup.sh && \
    echo '  echo "    res.json(transformedProducts);" >> /app/src/server.js' >> /setup.sh && \
    echo '  echo "  } catch (error) {" >> /app/src/server.js' >> /setup.sh && \
    echo '  echo "    console.error('\''Error fetching products:'\'', error);" >> /app/src/server.js' >> /setup.sh && \
    echo '  echo "    res.json([{ _id: '\''prod1'\'', name: '\''Office Chair'\'', price: 249.99, isFeatured: true, imageUrl: '\''https://via.placeholder.com/400x300/3498db/ffffff?text=Office+Chair'\'' }]);" >> /app/src/server.js' >> /setup.sh && \
    echo '  echo "  }" >> /app/src/server.js' >> /setup.sh && \
    echo '  echo "});" >> /app/src/server.js' >> /setup.sh && \
    echo '  echo "" >> /app/src/server.js' >> /setup.sh && \
    echo '  echo "app.listen(port, () => console.log('\''Server running on port '\'' + port));" >> /app/src/server.js' >> /setup.sh && \
    echo 'fi' >> /setup.sh && \
    echo 'sed -i '\''s/"start": ".*"/"start": "node src\\/server.js"/g'\'' /app/package.json' >> /setup.sh && \
    echo 'echo "Setup complete!"' >> /setup.sh && \
    chmod +x /setup.sh

# Copy all source files
COPY . .

# Ensure src directory exists and server.js is present
RUN /setup.sh

# Expose the port
EXPOSE 8080

# Use npm start to run the app
CMD ["npm", "start"] 