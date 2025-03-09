FROM node:20.11.1-alpine3.19

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all source files
COPY . .

# Debug: List files to verify structure
RUN echo "Directory structure verification:"
RUN ls -la
RUN ls -la src/

# Expose the port
EXPOSE 8080

# Use npm start to run the app
CMD ["npm", "start"] 