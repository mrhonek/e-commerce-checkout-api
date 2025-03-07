FROM node:20.11.1-alpine3.19

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --only=production

# Copy the bypass script
COPY deploy-bypass.js ./

# Copy environment variables
COPY .env* ./

# Expose port
EXPOSE 8080

# Create a placeholder dist directory
RUN mkdir -p dist && \
    echo "console.log('Using bypass script');" > dist/server.js

# Command to start the application using the bypass script
CMD ["node", "deploy-bypass.js"] 