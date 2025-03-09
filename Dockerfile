FROM node:20.11.1-alpine3.19

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Explicitly install TypeScript and ts-node
RUN npm install -g typescript ts-node

# Copy all files
COPY . .

# In case the middleware file doesn't have CORS headers, create a temporary version
# Force headers directly in the main entrypoint
RUN echo 'import express from "express";\n\
import { Request, Response, NextFunction } from "express";\n\
\n\
export function ensureCorsHeaders(req: Request, res: Response, next: NextFunction) {\n\
  res.header("Access-Control-Allow-Origin", "https://e-commerce-checkout-redesign.vercel.app");\n\
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");\n\
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");\n\
  res.header("Access-Control-Allow-Credentials", "true");\n\
  \n\
  if (req.method === "OPTIONS") {\n\
    return res.status(200).end();\n\
  }\n\
  next();\n\
}\n' > src/middleware/ensure-cors.ts

# Modify TypeScript server file to add permissive CORS
RUN sed -i '1i // CORS Override - Added by Dockerfile' src/server-ts.ts
RUN sed -i '/import cors from/a import { ensureCorsHeaders } from "./middleware/ensure-cors";' src/server-ts.ts
RUN sed -i '/app.use(cors(/a app.use(ensureCorsHeaders);' src/server-ts.ts

# Expose port
EXPOSE 8080

# Start the TypeScript server directly with ts-node
CMD ["ts-node", "src/server-ts.ts"] 