/**
 * Custom type definitions for Express
 */
import { UserPayload } from '../middleware/auth.middleware';

// Extend Express namespace
declare global {
  namespace Express {
    // Extend Request interface
    interface Request {
      // User from JWT authentication
      user?: UserPayload;
      
      // JWT token
      token?: string;
      
      // Cart data
      cart?: any;
      
      // Order data
      order?: any;
      
      // Any additional data we might add in the future
      [key: string]: any;
    }
  }
} 