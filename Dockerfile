FROM node:20.11.1-alpine3.19

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the entire source code
COPY . .

# Debug: List contents to verify files are copied correctly
RUN echo "Listing files in /app:" && ls -la && \
    echo "Listing files in /app/src:" && ls -la src/

# Expose port
EXPOSE 8080

# Command to start the application - use absolute path and find approach
CMD ["sh", "-c", "find /app -name 'server-ts.ts' && node --require ts-node/register $(find /app -name 'server-ts.ts' | head -n 1)"] 