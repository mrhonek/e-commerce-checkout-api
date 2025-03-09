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

# Copy the fallback server file if server-ts.ts doesn't exist
RUN if [ ! -f "src/server-ts.ts" ]; then \
    echo "Using fallback server file..." && \
    if [ -f "src/fallback-server.ts" ]; then \
      cp src/fallback-server.ts src/server-ts.ts; \
    else \
      echo "ERROR: No server file found!"; \
      exit 1; \
    fi; \
fi

# Debug: List files in src directory
RUN echo "Files in src directory:" && ls -la src/

# Expose port
EXPOSE 8080

# Command to start the application using npm start
CMD ["npm", "run", "start"] 