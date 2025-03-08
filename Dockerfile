FROM node:20.11.1-alpine3.19

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the entire source code
COPY . .

# Expose port
EXPOSE 8080

# Set working directory to ensure paths are correct
WORKDIR /app

# Command to start the application using node with ts-node/register
CMD ["node", "--require", "ts-node/register", "./src/server-ts.ts"] 