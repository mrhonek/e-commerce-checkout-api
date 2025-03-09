FROM node:20.11.1-alpine3.19

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Explicitly install TypeScript and ts-node
RUN npm install -g typescript ts-node

# Copy all files
COPY . .

# Create necessary directories if they don't exist
RUN mkdir -p src/middleware

# In case the middleware file doesn't have CORS headers, create a temporary version
# Force headers directly in the main entrypoint
RUN echo 'import express from "express";\
import { Request, Response, NextFunction } from "express";\
\
export function ensureCorsHeaders(req: Request, res: Response, next: NextFunction) {\
  res.header("Access-Control-Allow-Origin", "https://e-commerce-checkout-redesign.vercel.app");\
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");\
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");\
  res.header("Access-Control-Allow-Credentials", "true");\
  \
  if (req.method === "OPTIONS") {\
    return res.status(200).end();\
  }\
  next();\
}' > src/middleware/ensure-cors.ts

# List files to verify middleware directory and file exist
RUN ls -la src/middleware/

# Modify TypeScript server file to add permissive CORS
RUN sed -i '1i // CORS Override - Added by Dockerfile' src/server-ts.ts || echo "Failed to add comment"
RUN sed -i '/import cors from/a import { ensureCorsHeaders } from "./middleware/ensure-cors";' src/server-ts.ts || echo "Failed to add import"
RUN sed -i '/app.use(cors(/a app.use(ensureCorsHeaders);' src/server-ts.ts || echo "Failed to add middleware"

# Expose port
EXPOSE 8080

# Start the TypeScript server directly with ts-node
CMD ["ts-node", "src/server-ts.ts"] 