FROM node:20.11.1-alpine3.19

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install
RUN npm install -g typescript ts-node

# Copy TypeScript config
COPY tsconfig.json ./

# Copy source files
COPY src ./src

# Debug: List files to verify structure
RUN echo "Root directory contents:"
RUN ls -la
RUN echo "src directory contents:"
RUN ls -la src

# Ensure TypeScript dependencies are installed
RUN npm install --save-dev typescript ts-node @types/express @types/cors

# Expose port
EXPOSE 8080

# Start the TypeScript server
CMD ["npx", "ts-node", "src/server-ts.ts"] 