/**
 * CORS Middleware
 * Enhanced CORS handling for cross-origin requests
 */

import { Request, Response, NextFunction } from 'express';

/**
 * CORS Headers Middleware
 * Applies CORS headers to all responses to allow cross-origin requests
 */
export const corsHeadersMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Allow requests from any origin
  res.header('Access-Control-Allow-Origin', '*');
  
  // Allow specific methods
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  
  // Allow specific headers
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  
  // Allow credentials
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Log the request origin for debugging
  console.log(`[CORS] Request from: ${req.headers.origin || 'Unknown origin'}`);
  
  // Handle preflight requests (OPTIONS)
  if (req.method === 'OPTIONS') {
    console.log('[CORS] Handling OPTIONS preflight request');
    return res.status(200).end();
  }
  
  next();
}; 