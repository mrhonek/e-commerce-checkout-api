FROM node:20.11.1-alpine3.19

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy TypeScript config and source files
COPY tsconfig*.json ./
COPY src ./src

# Debug: List the src directory contents
RUN echo "Contents of the src directory:"
RUN ls -la src/

# Build TypeScript files
RUN if [ -f tsconfig.json ]; then \
    echo "Building TypeScript files..." && \
    npx tsc || echo "TypeScript compilation failed"; \
fi

# Debug: List contents again after build
RUN echo "Contents after TypeScript build:"
RUN ls -la src/

# Ensure the server file exists and is executable
RUN if [ ! -f src/server.js ] && [ -f src/server.ts ]; then \
    echo "TypeScript didn't generate the output file. Using ts-node instead"; \
    npm install -g ts-node typescript; \
fi

# Expose port
EXPOSE 8080

# Command to start the application - use ts-node if JS file doesn't exist
CMD if [ -f src/server.js ]; then \
      echo "Starting with Node.js" && \
      node src/server.js; \
    elif [ -f src/server-ts.ts ]; then \
      echo "Starting with ts-node (server-ts.ts)" && \
      npx ts-node src/server-ts.ts; \
    elif [ -f src/server.ts ]; then \
      echo "Starting with ts-node (server.ts)" && \
      npx ts-node src/server.ts; \
    else \
      echo "No server file found. Exiting." && \
      exit 1; \
    fi 