FROM node:20.11.1-alpine3.19

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Debug: List current directory structure before copying
RUN echo "Contents of current directory before copying:"
RUN ls -la

# Copy all files from the backend directory
COPY . .

# Debug: List current directory structure after copying
RUN echo "Contents of current directory after copying:"
RUN ls -la

# Create src directory if it doesn't exist
RUN mkdir -p /app/src

# Debug: Check if the src directory exists and what's in it
RUN echo "Contents of /app/src directory:"
RUN ls -la /app/src/ || echo "Directory is empty"

# Copy the fallback server file to server.js if server.js doesn't exist
RUN if [ ! -f /app/src/server.js ] && [ -f /app/src/fallback-server.js ]; then \
    echo "Copying fallback-server.js to server.js"; \
    cp /app/src/fallback-server.js /app/src/server.js; \
fi

# If server.js still doesn't exist, create a minimal one
RUN if [ ! -f /app/src/server.js ]; then \
    echo "Creating a minimal server.js file"; \
    echo 'const express = require("express");' > /app/src/server.js; \
    echo 'const cors = require("cors");' >> /app/src/server.js; \
    echo 'const app = express();' >> /app/src/server.js; \
    echo 'const port = process.env.PORT || 8080;' >> /app/src/server.js; \
    echo 'app.use(cors());' >> /app/src/server.js; \
    echo 'app.use(express.json());' >> /app/src/server.js; \
    echo 'const products = [' >> /app/src/server.js; \
    echo '  { _id: "prod1", name: "Ergonomic Office Chair", description: "Premium chair", price: 249.99, stockQuantity: 15 },' >> /app/src/server.js; \
    echo '  { _id: "prod2", name: "Wireless Headphones", description: "Premium headphones", price: 199.99, stockQuantity: 25 },' >> /app/src/server.js; \
    echo '  { _id: "prod3", name: "Smart Watch", description: "Latest smart watch", price: 329.99, stockQuantity: 10 }' >> /app/src/server.js; \
    echo '];' >> /app/src/server.js; \
    echo 'app.get("/api/health", (req, res) => { res.json({ status: "ok" }); });' >> /app/src/server.js; \
    echo 'app.get("/api/products", (req, res) => { res.json(products); });' >> /app/src/server.js; \
    echo 'app.get("/api/cart", (req, res) => { res.json({ items: [] }); });' >> /app/src/server.js; \
    echo 'app.listen(port, () => { console.log(`Server running on port ${port}`); });' >> /app/src/server.js; \
fi

# Ensure the file is executable
RUN chmod +x /app/src/server.js || echo "Failed to make server.js executable"

# Check if server.js exists now
RUN echo "Final check for server.js:"
RUN ls -la /app/src/server.js || echo "server.js still missing"

# Expose port
EXPOSE 8080

# Command to start the application
CMD ["npm", "start"] 