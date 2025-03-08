FROM node:20.11.1-alpine3.19

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies including dev dependencies
RUN npm install

# Copy the entire source code
COPY . .

# Build TypeScript code
RUN npm run build

# Expose port
EXPOSE 8080

# Command to start the application using the TypeScript server
CMD ["npx", "ts-node", "src/server-ts.ts"] 