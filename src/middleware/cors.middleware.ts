/**
 * CORS Middleware
 * Enhanced CORS handling for cross-origin requests
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to add CORS headers to all responses
 */
export const corsHeadersMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Allow requests from the Vercel frontend and development environments
  const allowedOrigins = [
    'https://e-commerce-checkout-redesign.vercel.app',
    'http://e-commerce-checkout-redesign.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173'
  ];
  
  const origin = req.headers.origin;
  
  // Check if the request origin is in our allowed list
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    // Fallback to Vercel domain for other origins
    res.setHeader('Access-Control-Allow-Origin', 'https://e-commerce-checkout-redesign.vercel.app');
  }
  
  // Configure other CORS headers
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Log the request origin for debugging
  console.log(`[CORS] Request from: ${req.headers.origin || 'Unknown origin'}`);
  
  // Handle preflight requests (OPTIONS)
  if (req.method === 'OPTIONS') {
    console.log('[CORS] Handling OPTIONS preflight request');
    res.status(200).end();
    return;
  }
  
  next();
}; 