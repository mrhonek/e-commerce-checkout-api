FROM node:20.11.1-alpine3.19

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Create src directory
RUN mkdir -p /app/src

# Copy src directory explicitly 
COPY src/ /app/src/

# Make sure server.js exists and is executable
RUN ls -la /app/src/
RUN chmod +x /app/src/server.js

# Expose port
EXPOSE 8080

# Command to start the application
CMD ["npm", "start"] 