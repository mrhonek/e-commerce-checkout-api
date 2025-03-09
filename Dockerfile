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

# Command to start the application
CMD ["npm", "start"] 