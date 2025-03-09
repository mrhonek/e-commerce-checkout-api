FROM node:20.11.1-alpine3.19

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all source files
COPY . .

# Debug: List files to verify structure
RUN echo "Root directory contents:"
RUN ls -la
RUN echo "Source directory contents:"
RUN ls -la src/

# Modify package.json to use node directly with server.js
RUN echo "Modifying package.json to use direct node with server.js"
RUN sed -i 's/"start": ".*"/"start": "node src\/server.js"/g' package.json

# Final verification
RUN echo "Final verification of files:"
RUN cat package.json | grep start

# Expose the port
EXPOSE 8080

# Use npm start to run the app
CMD ["npm", "start"] 