FROM node:20.11.1-alpine3.19

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies including ts-node globally
RUN npm install
RUN npm install -g ts-node typescript

# Copy the entire source code
COPY . .

# Expose port
EXPOSE 8080

# Command to start the application using ts-node directly
CMD ["npx", "ts-node", "src/server-ts.ts"] 