FROM node:20-alpine as builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build TypeScript code
RUN npm run build

# Production stage
FROM node:20-alpine as production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm install --only=production

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Copy environment variables if needed
COPY .env* ./

# Expose port
EXPOSE 8080

# Command to start the application (using the built files)
CMD ["npm", "run", "start"]

# Fallback to bypass script if TypeScript build fails
# Comment out the above CMD and uncomment the below line if you have issues
# CMD ["node", "deploy-bypass.js"] 