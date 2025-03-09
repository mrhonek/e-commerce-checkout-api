FROM node:20.11.1-alpine3.19

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Install express and related packages explicitly
RUN npm install mongodb express cors

# Copy all source files 
COPY . .

# Expose the port
EXPOSE 8080

# Use node to run the server directly
CMD ["node", "src/server.js"] 