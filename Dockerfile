FROM node:20.11.1-alpine3.19

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Install required packages directly
RUN npm install express cors

# Copy only what we need
COPY src/server.js /app/src/server.js

# Debug the content
RUN echo "Checking if server.js exists:"
RUN ls -la /app/src/

# Expose the port
EXPOSE 8080

# Use node to run the server directly
CMD ["node", "src/server.js"] 