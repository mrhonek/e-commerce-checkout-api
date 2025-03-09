FROM node:20.11.1-alpine3.19

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all files from the backend directory
COPY . .

# Expose port
EXPOSE 8080

# Command to start the application
CMD ["npm", "start"] 