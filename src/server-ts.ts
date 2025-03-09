/**
 * TypeScript Server Entry Point
 * 
 * This is a TypeScript version of the server that uses TypeScript modules.
 * It will gradually replace the deploy-bypass.js file as more code is migrated.
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import { initializeRoutes } from './routes';
import { loggerMiddleware } from './middleware';
import db from './db/connection';
import { corsHeadersMiddleware } from './middleware/cors.middleware';

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const port = process.env.PORT || 5000;

// CORS configuration with specific allowed origins
app.use(cors({
  origin: [
    'https://e-commerce-checkout-redesign.vercel.app',
    'http://e-commerce-checkout-redesign.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Apply our custom CORS middleware as an additional layer
app.use(corsHeadersMiddleware);

// Handle preflight requests globally
app.options('*', cors({ 
  origin: 'https://e-commerce-checkout-redesign.vercel.app',
  credentials: true 
}));

// Additional direct CORS headers for certain requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://e-commerce-checkout-redesign.vercel.app');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

app.use(express.json()); // Parse JSON requests
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded requests
app.use(cookieParser()); // Parse cookies
app.use(compression()); // Compress responses
app.use(loggerMiddleware); // Log requests and responses

// Root-level CORS test endpoint that bypasses the router
app.get('/test-cors', (req, res) => {
  // Add all CORS headers directly to this response
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  res.json({
    success: true,
    message: 'Direct CORS test endpoint successful',
    origin: req.headers.origin || 'No origin',
    timestamp: new Date().toISOString(),
    host: req.hostname,
    method: req.method,
    path: req.path,
    ip: req.ip,
    headers: {
      request: req.headers,
      response: {
        'Access-Control-Allow-Origin': res.getHeader('Access-Control-Allow-Origin'),
        'Access-Control-Allow-Methods': res.getHeader('Access-Control-Allow-Methods'),
        'Access-Control-Allow-Headers': res.getHeader('Access-Control-Allow-Headers')
      }
    }
  });
});

// Special handler for CORS issues
app.use('/api/cors-test', (req, res) => {
  res.json({ 
    message: 'CORS is working properly!',
    headers: req.headers,
    timestamp: new Date().toISOString()
  });
});

// Connect to MongoDB
db.connectDB()
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Initialize all routes
    initializeRoutes(app);
    
    // Start server
    if (process.env.NODE_ENV !== 'test') {
      app.listen(port, () => {
        console.log(`Server running on port ${port}`);
        console.log(`CORS configured to allow requests from: https://e-commerce-checkout-redesign.vercel.app`);
      });
    }
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });

export default app; 