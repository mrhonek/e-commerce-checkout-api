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

// ** TEMPORARY ** Permissive CORS configuration to unblock development
app.use(cors({
  origin: '*', // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Apply our custom CORS middleware as an additional layer
app.use(corsHeadersMiddleware);

// Handle preflight requests globally
app.options('*', cors({ origin: '*' }));

app.use(express.json()); // Parse JSON requests
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded requests
app.use(cookieParser()); // Parse cookies
app.use(compression()); // Compress responses
app.use(loggerMiddleware); // Log requests and responses

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
        console.log(`TypeScript server running on port ${port}`);
      });
    }
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });

export default app; 