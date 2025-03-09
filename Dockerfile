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

# Ensure the file is executable
RUN chmod +x /app/src/server.js

# Check if server.js exists now
RUN echo "Final check for server.js:"
RUN ls -la /app/src/server.js || echo "server.js still missing"

# Expose port
EXPOSE 8080

# Command to start the application
CMD ["npm", "start"] 