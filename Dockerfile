FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy only necessary files
COPY deploy-bypass.js .
COPY .env* ./

# Create dist directory (to satisfy any references to it)
RUN mkdir -p dist && echo '// Placeholder' > dist/server.js

# Set up environment
ENV NODE_ENV=production

# Expose the port (Railway will override this)
EXPOSE 8080

# Start the app
CMD ["node", "deploy-bypass.js"] 