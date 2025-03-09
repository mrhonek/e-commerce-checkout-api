FROM node:20.11.1-alpine3.19

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all files from the backend directory
COPY . .

# Debug: List files to confirm server.js exists
RUN ls -la /app/src/

# Ensure the file is executable
RUN chmod +x /app/src/server.js

# Expose port
EXPOSE 8080

# Command to start the application
CMD ["npm", "start"] 